import { defineRule, metadataUriIssue, ruleDocUrl } from "@nft-lint/core";
import { CONTENT_TYPES, INSCRIPTION_SIZE_WARN, isInscriptionId } from "./ids.js";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const contentTypeRule = defineRule({
  id: "bitcoin/content-type",
  chains: ["bitcoin"],
  standards: ["ordinals"],
  severity: "error",
  docs: ruleDocUrl("bitcoin/content-type"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    const raw = json.content_type ?? json.contentType;
    if (raw === undefined) return;
    const path = "content_type" in json ? "content_type" : "contentType";
    if (typeof raw !== "string" || !raw.includes("/")) {
      ctx.report({
        path,
        message:
          "content_type must be a MIME type such as image/png, text/html, or application/json.",
      });
      return;
    }
    const mime = raw.split(";")[0]?.trim().toLowerCase() ?? "";
    if (!CONTENT_TYPES.has(mime)) {
      ctx.report({
        path,
        severity: "warn",
        message: `content_type "${mime}" is not one of the types ord and Magic Eden commonly render.`,
      });
    }
  },
});

export const collectionRule = defineRule({
  id: "bitcoin/collection",
  chains: ["bitcoin"],
  standards: ["ordinals"],
  severity: "error",
  docs: ruleDocUrl("bitcoin/collection"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    const collectionShaped =
      "slug" in json || "supply" in json || "inscription_icon" in json || "twitter_link" in json;
    if (!collectionShaped) return;
    if ("slug" in json && (typeof json.slug !== "string" || !SLUG.test(json.slug))) {
      ctx.report({
        path: "slug",
        message:
          "slug must be lowercase words separated by hyphens, matching the collection directory name.",
      });
    }
    if ("supply" in json) {
      const supply = typeof json.supply === "string" ? Number(json.supply) : json.supply;
      if (typeof supply !== "number" || !Number.isInteger(supply) || supply < 1) {
        ctx.report({
          path: "supply",
          message: "supply must be a positive integer (a number or a decimal string).",
        });
      }
    }
    if ("inscription_icon" in json && !isInscriptionId(json.inscription_icon)) {
      ctx.report({
        path: "inscription_icon",
        message: "inscription_icon must be the inscription id of the collection cover, not a URL.",
      });
    }
    for (const field of ["website_link", "twitter_link", "discord_link"] as const) {
      if (!(field in json) || json[field] === "") continue;
      if (typeof json[field] !== "string") {
        ctx.report({ path: field, message: `${field} must be an https URL.` });
        continue;
      }
      const issue = metadataUriIssue(json[field]);
      if (issue) ctx.report({ path: field, message: `${field} ${issue}` });
    }
  },
});

export const sizeRule = defineRule({
  id: "bitcoin/size",
  chains: ["bitcoin"],
  standards: ["ordinals"],
  severity: "warn",
  docs: ruleDocUrl("bitcoin/size"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json || !("content_length" in json)) return;
    const length = json.content_length;
    if (typeof length !== "number" || !Number.isInteger(length) || length < 0) {
      ctx.report({
        path: "content_length",
        severity: "error",
        message: "content_length must be an integer number of bytes.",
      });
      return;
    }
    if (length > INSCRIPTION_SIZE_WARN) {
      ctx.report({
        path: "content_length",
        message: `content_length is ${length} bytes. Inscriptions over ${INSCRIPTION_SIZE_WARN} bytes still confirm, but many indexers and marketplaces time out or refuse to render them.`,
      });
    }
  },
});
