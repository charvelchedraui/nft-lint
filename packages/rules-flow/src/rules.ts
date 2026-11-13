import {
  defineRule,
  isRecord,
  metadataUriIssue,
  ruleDocUrl,
  type RuleContext,
} from "@nft-lint/core";
import { asList, fileIssue, isFlowAddress } from "./files.js";

const MIME = /^[\w.+-]+\/[\w.+-]+$/;

function reportFile(ctx: RuleContext, path: string, value: unknown) {
  const issue = fileIssue(value);
  if (issue) ctx.report({ path, message: `${path} ${issue}` });
}

export const displayRule = defineRule({
  id: "flow/display",
  chains: ["flow"],
  standards: ["flow-metadata-views"],
  severity: "error",
  docs: ruleDocUrl("flow/display"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    const display = isRecord(json.display) ? json.display : json;
    const nested = isRecord(json.display);
    const prefix = nested ? "display." : "";
    if (typeof display.name !== "string" || display.name.trim() === "") {
      ctx.report({
        path: `${prefix}name`,
        message: "Display.name must be a non-empty string.",
      });
    }
    if (typeof display.description !== "string") {
      ctx.report({
        path: `${prefix}description`,
        message: "Display.description must be a string.",
      });
    } else if (display.description === "") {
      ctx.report({
        path: `${prefix}description`,
        severity: "warn",
        message: "Display.description is empty.",
      });
    }
    if (!("thumbnail" in display)) {
      ctx.report({
        path: `${prefix}thumbnail`,
        message: "Display.thumbnail is required. Use an HTTPFile {url} or an IPFSFile {cid, path}.",
      });
    } else {
      reportFile(ctx, `${prefix}thumbnail`, display.thumbnail);
    }
    if ("externalURL" in json) {
      const url =
        typeof json.externalURL === "string" ? json.externalURL : externalUrl(json.externalURL);
      if (!url) {
        ctx.report({ path: "externalURL", message: "externalURL must be a string or {url}." });
      } else {
        const issue = metadataUriIssue(url);
        if (issue) ctx.report({ path: "externalURL", message: `externalURL ${issue}` });
      }
    }
  },
});

export const mediasRule = defineRule({
  id: "flow/medias",
  chains: ["flow"],
  standards: ["flow-metadata-views"],
  severity: "error",
  docs: ruleDocUrl("flow/medias"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("medias" in ctx.json)) return;
    const medias = ctx.json.medias;
    if (!Array.isArray(medias)) {
      ctx.report({ path: "medias", message: "medias must be an array of {file, mediaType}." });
      return;
    }
    medias.forEach((media, index) => {
      const path = `medias[${index}]`;
      if (!isRecord(media)) {
        ctx.report({ path, message: "Each media must be an object with file and mediaType." });
        return;
      }
      if (!("file" in media)) {
        ctx.report({ path: `${path}.file`, message: "media.file is required." });
      } else {
        reportFile(ctx, `${path}.file`, media.file);
      }
      if (typeof media.mediaType !== "string" || !MIME.test(media.mediaType)) {
        ctx.report({
          path: `${path}.mediaType`,
          message: "mediaType must be a type/subtype string, such as image/png.",
        });
      }
    });
  },
});

export const royaltiesRule = defineRule({
  id: "flow/royalties",
  chains: ["flow"],
  standards: ["flow-metadata-views"],
  severity: "error",
  docs: ruleDocUrl("flow/royalties"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("royalties" in ctx.json)) return;
    const list = asList(ctx.json.royalties, "cutInfos");
    if (!list) {
      ctx.report({
        path: "royalties",
        message:
          "royalties must be an array, or {cutInfos: [...]}, of {receiver, cut, description}.",
      });
      return;
    }
    let percent = 0;
    let numeric = true;
    list.forEach((entry, index) => {
      const path = `royalties[${index}]`;
      if (!isRecord(entry)) {
        ctx.report({ path, message: "Each royalty must be an object." });
        numeric = false;
        return;
      }
      const receiver = typeof entry.receiver === "string" ? entry.receiver : "";
      if (!isFlowAddress(receiver)) {
        ctx.report({
          path: `${path}.receiver`,
          message: "receiver must be a Flow address, 0x plus up to 16 hex characters.",
        });
      }
      const cut = typeof entry.cut === "string" ? Number(entry.cut) : entry.cut;
      if (typeof cut !== "number" || !Number.isFinite(cut) || cut < 0 || cut > 1) {
        numeric = false;
        ctx.report({
          path: `${path}.cut`,
          message:
            "cut must be a number from 0 to 1. MetadataViews rejects anything outside that range.",
        });
      } else {
        percent += cut * 100;
      }
      if (typeof entry.description !== "string") {
        ctx.report({
          path: `${path}.description`,
          message: "royalty description must be a string.",
        });
      }
    });
    if (numeric && percent > ctx.config.royaltyWarnAbovePercent) {
      ctx.report({
        path: "royalties",
        severity: "warn",
        message: `Royalties total ${percent}%, above the ${ctx.config.royaltyWarnAbovePercent}% warning line.`,
      });
    }
  },
});

export const editionsRule = defineRule({
  id: "flow/editions",
  chains: ["flow"],
  standards: ["flow-metadata-views"],
  severity: "error",
  docs: ruleDocUrl("flow/editions"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("editions" in ctx.json)) return;
    const list =
      asList(ctx.json.editions, "infoList") ??
      (isRecord(ctx.json.editions) ? [ctx.json.editions] : null);
    if (!list) {
      ctx.report({
        path: "editions",
        message: "editions must be an array, {infoList: [...]}, or one {number, max} object.",
      });
      return;
    }
    list.forEach((edition, index) => {
      const path = `editions[${index}]`;
      if (!isRecord(edition)) {
        ctx.report({ path, message: "Each edition must be an object." });
        return;
      }
      const number = edition.number;
      const max = edition.max;
      if (typeof number !== "number" || !Number.isInteger(number) || number < 1) {
        ctx.report({ path: `${path}.number`, message: "edition number must be an integer >= 1." });
        return;
      }
      if (max !== undefined && max !== null) {
        if (typeof max !== "number" || !Number.isInteger(max) || max < 1) {
          ctx.report({
            path: `${path}.max`,
            message: "edition max must be an integer >= 1, or omitted for an open edition.",
          });
        } else if (number > max) {
          ctx.report({
            path: `${path}.number`,
            message: `edition number ${number} is greater than max ${max}. MetadataViews rejects that.`,
          });
        }
      }
      if ("name" in edition && edition.name !== null && typeof edition.name !== "string") {
        ctx.report({ path: `${path}.name`, message: "edition name must be a string or null." });
      }
    });
  },
});

export const traitsRule = defineRule({
  id: "flow/traits",
  chains: ["flow"],
  standards: ["flow-metadata-views"],
  severity: "error",
  docs: ruleDocUrl("flow/traits"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("traits" in ctx.json)) return;
    const list = asList(ctx.json.traits, "traits");
    if (!list) {
      ctx.report({ path: "traits", message: "traits must be an array of {name, value}." });
      return;
    }
    list.forEach((trait, index) => {
      const path = `traits[${index}]`;
      if (!isRecord(trait)) {
        ctx.report({ path, message: "Each trait must be an object with name and value." });
        return;
      }
      if (typeof trait.name !== "string" || trait.name.trim() === "") {
        ctx.report({ path: `${path}.name`, message: "trait name must be a non-empty string." });
      }
      if (typeof trait.value !== "string" && typeof trait.value !== "number") {
        ctx.report({ path: `${path}.value`, message: "trait value must be a string or a number." });
      }
      if ("rarity" in trait && trait.rarity !== null && !isRecord(trait.rarity)) {
        ctx.report({
          path: `${path}.rarity`,
          message: "rarity must be an object with description, or omitted.",
        });
      }
    });
  },
});

export const collectionDisplayRule = defineRule({
  id: "flow/collection-display",
  chains: ["flow"],
  standards: ["flow-metadata-views"],
  severity: "error",
  docs: ruleDocUrl("flow/collection-display"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("collectionDisplay" in ctx.json)) return;
    const display = ctx.json.collectionDisplay;
    if (!isRecord(display)) {
      ctx.report({ path: "collectionDisplay", message: "collectionDisplay must be an object." });
      return;
    }
    if (typeof display.name !== "string" || display.name.trim() === "") {
      ctx.report({
        path: "collectionDisplay.name",
        message: "NFTCollectionDisplay.name must be a non-empty string.",
      });
    }
    if (typeof display.description !== "string") {
      ctx.report({
        path: "collectionDisplay.description",
        message: "NFTCollectionDisplay.description must be a string.",
      });
    }
    for (const field of ["squareImage", "bannerImage"] as const) {
      if (!(field in display)) {
        ctx.report({
          path: `collectionDisplay.${field}`,
          message: `NFTCollectionDisplay.${field} is required (a Media with file and mediaType).`,
        });
        continue;
      }
      const media = display[field];
      if (!isRecord(media)) {
        ctx.report({
          path: `collectionDisplay.${field}`,
          message: `${field} must be a Media object.`,
        });
        continue;
      }
      reportFile(ctx, `collectionDisplay.${field}.file`, media.file ?? media);
      if (typeof media.mediaType !== "string" || !MIME.test(media.mediaType)) {
        ctx.report({
          path: `collectionDisplay.${field}.mediaType`,
          message: `${field}.mediaType must be a type/subtype string.`,
        });
      }
    }
  },
});

function externalUrl(value: unknown): string | null {
  if (isRecord(value) && typeof value.url === "string") return value.url;
  return null;
}
