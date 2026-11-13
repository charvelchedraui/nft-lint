import {
  defineRule,
  isRecord,
  metadataUriIssue,
  ruleDocUrl,
  type RuleContext,
} from "@nft-lint/core";

const STARS = /^stars1[02-9ac-hj-np-z]{38,}$/;
const SG721_MAX_SHARE = 0.1;

function metadataRoot(json: Record<string, unknown>): Record<string, unknown> {
  return isRecord(json.extension) ? { ...json, ...json.extension } : json;
}

function checkUri(ctx: RuleContext, path: string, value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    ctx.report({ path, message: `${path} must be a non-empty URI.` });
    return;
  }
  const issue = metadataUriIssue(value);
  if (issue) ctx.report({ path, message: `${path} ${issue}` });
}

export const metadataRule = defineRule({
  id: "stargaze/metadata",
  chains: ["stargaze"],
  standards: ["cw721"],
  severity: "error",
  docs: ruleDocUrl("stargaze/metadata"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    const meta = metadataRoot(json);
    const hasName = typeof meta.name === "string" && meta.name.trim() !== "";
    if (!hasName) {
      ctx.report({
        path: isRecord(json.extension) ? "extension.name" : "name",
        message: "name must be a non-empty string, on the token JSON or in the sg721 extension.",
      });
    }
    if ("description" in meta && typeof meta.description !== "string") {
      ctx.report({ path: "description", message: "description must be a string." });
    } else if (meta.description === "") {
      ctx.report({ path: "description", severity: "warn", message: "description is empty." });
    }
    const hasImage = typeof meta.image === "string" && meta.image.trim() !== "";
    const hasTokenUri = typeof json.token_uri === "string" && json.token_uri.trim() !== "";
    if (!hasImage && !hasTokenUri) {
      ctx.report({
        path: "image",
        message:
          "sg721 needs extension.image or token_uri. Marketplaces cannot render the token without one.",
      });
    }
    if (hasImage && typeof meta.image === "string") {
      const path =
        isRecord(json.extension) && typeof json.extension.image === "string"
          ? "extension.image"
          : "image";
      const issue = metadataUriIssue(meta.image);
      if (issue) ctx.report({ path, message: `${path} ${issue}` });
    }
  },
});

export const tokenUriRule = defineRule({
  id: "stargaze/token-uri",
  chains: ["stargaze"],
  standards: ["cw721"],
  severity: "error",
  docs: ruleDocUrl("stargaze/token-uri"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json || !("token_uri" in json)) return;
    checkUri(ctx, "token_uri", json.token_uri);
    if ("token_id" in json && typeof json.token_id !== "string") {
      ctx.report({
        path: "token_id",
        message: "cw721 token_id is a string. A JSON number drops leading zeros and can collide.",
      });
    }
  },
});

export const attributesRule = defineRule({
  id: "stargaze/attributes",
  chains: ["stargaze"],
  standards: ["cw721"],
  severity: "error",
  docs: ruleDocUrl("stargaze/attributes"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json) return;
    const sources: { path: string; value: unknown }[] = [];
    if ("attributes" in ctx.json) sources.push({ path: "attributes", value: ctx.json.attributes });
    if (isRecord(ctx.json.extension) && "attributes" in ctx.json.extension) {
      sources.push({ path: "extension.attributes", value: ctx.json.extension.attributes });
    }
    for (const source of sources) {
      if (!Array.isArray(source.value)) {
        ctx.report({
          path: source.path,
          message: "attributes must be an array of {trait_type, value}.",
        });
        continue;
      }
      source.value.forEach((attribute, index) => {
        const path = `${source.path}[${index}]`;
        if (!isRecord(attribute)) {
          ctx.report({
            path,
            message: "Each attribute must be an object with trait_type and value.",
          });
          return;
        }
        if (typeof attribute.trait_type !== "string" || attribute.trait_type.trim() === "") {
          ctx.report({
            path: `${path}.trait_type`,
            message: "trait_type must be a non-empty string.",
          });
        }
        if (typeof attribute.value !== "string" && typeof attribute.value !== "number") {
          ctx.report({ path: `${path}.value`, message: "value must be a string or a number." });
        }
      });
    }
  },
});

export const royaltyRule = defineRule({
  id: "stargaze/royalty",
  chains: ["stargaze"],
  standards: ["cw721"],
  severity: "error",
  docs: ruleDocUrl("stargaze/royalty"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json) return;
    const royalty =
      (isRecord(ctx.json.royalty_info) && ctx.json.royalty_info) ||
      (isRecord(ctx.json.extension) && isRecord(ctx.json.extension.royalty_info)
        ? ctx.json.extension.royalty_info
        : null);
    if (!royalty) return;
    const shareRaw = royalty.share;
    const share = typeof shareRaw === "string" ? Number(shareRaw) : shareRaw;
    if (typeof share !== "number" || !Number.isFinite(share) || share < 0 || share > 1) {
      ctx.report({
        path: "royalty_info.share",
        message:
          'share must be a decimal string from "0" to "1". sg721 uses 0.05 for 5%, not basis points.',
      });
      return;
    }
    if (share > SG721_MAX_SHARE) {
      ctx.report({
        path: "royalty_info.share",
        message: `share ${share} is above 0.10. sg721 rejects a royalty over 10%.`,
      });
    } else if (share * 100 > ctx.config.royaltyWarnAbovePercent) {
      ctx.report({
        path: "royalty_info.share",
        severity: "warn",
        message: `Royalty is ${share * 100}%, above the ${ctx.config.royaltyWarnAbovePercent}% warning line.`,
      });
    }
    const address = royalty.payment_address ?? royalty.address;
    if (typeof address !== "string" || !STARS.test(address)) {
      ctx.report({
        path: "royalty_info.payment_address",
        message: "payment_address must be a Stargaze bech32 address starting with stars1.",
      });
    }
  },
});
