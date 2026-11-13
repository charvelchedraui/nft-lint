import {
  defineRule,
  isRecord,
  metadataUriIssue,
  ruleDocUrl,
  type RuleContext,
} from "@nft-lint/core";

const TON_USER = /^(?:EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}$/;
const TON_RAW = /^(?:-1|0):[0-9a-fA-F]{64}$/;

export function isTonAddress(value: string): boolean {
  return TON_USER.test(value) || TON_RAW.test(value);
}

function checkUri(ctx: RuleContext, path: string, value: unknown, label: string) {
  if (typeof value !== "string" || value.trim() === "") {
    ctx.report({ path, message: `${label} must be a non-empty URI.` });
    return;
  }
  const issue = metadataUriIssue(value);
  if (issue) ctx.report({ path, message: `${label} ${issue}` });
}

export const requiredFieldsRule = defineRule({
  id: "ton/required-fields",
  chains: ["ton"],
  standards: ["tep-64"],
  severity: "error",
  docs: ruleDocUrl("ton/required-fields"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    const offChainPointer =
      typeof json.uri === "string" && json.uri.trim() !== "" && !("name" in json);
    if (offChainPointer) return;
    if (typeof json.name !== "string" || json.name.trim() === "") {
      ctx.report({
        path: "name",
        message: "name must be a non-empty string. TON wallets title the NFT from it.",
      });
    }
    if (typeof json.description !== "string") {
      ctx.report({ path: "description", message: "description must be a string." });
    } else if (json.description === "") {
      ctx.report({
        path: "description",
        severity: "warn",
        message: "description is empty.",
      });
    }
    const hasImage = typeof json.image === "string" && json.image.trim() !== "";
    const hasImageData = typeof json.image_data === "string" && json.image_data.trim() !== "";
    if (!hasImage && !hasImageData) {
      ctx.report({
        path: "image",
        message:
          "TEP-64 items need image (a URI) or image_data (base64). Getgems shows nothing without one.",
      });
    }
    if (hasImage && typeof json.image === "string") checkUri(ctx, "image", json.image, "image");
    if (hasImageData && typeof json.image_data === "string" && !isBase64(json.image_data)) {
      ctx.report({
        path: "image_data",
        message:
          "image_data must be base64 in off-chain JSON (TEP-64). On-chain cells store the raw bytes instead.",
      });
    }
  },
});

export const contentUriRule = defineRule({
  id: "ton/content-uri",
  chains: ["ton"],
  standards: ["tep-64"],
  severity: "error",
  docs: ruleDocUrl("ton/content-uri"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    if ("uri" in json) checkUri(ctx, "uri", json.uri, "uri");
    if ("content_url" in json) checkUri(ctx, "content_url", json.content_url, "content_url");
    if ("video" in json) checkUri(ctx, "video", json.video, "video");
    if (
      typeof json.uri === "string" &&
      json.uri.trim() !== "" &&
      ("name" in json || "image" in json)
    ) {
      ctx.report({
        path: "uri",
        severity: "warn",
        message:
          "Semi-chain content (TEP-64) merges uri with these fields, and on-chain values win on a collision. Do not put the same key in both places with different values.",
      });
    }
  },
});

export const royaltyRule = defineRule({
  id: "ton/royalty",
  chains: ["ton"],
  standards: ["tep-64"],
  severity: "error",
  docs: ruleDocUrl("ton/royalty"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json || !("royalty_params" in json)) return;
    const royalty = json.royalty_params;
    if (!isRecord(royalty)) {
      ctx.report({
        path: "royalty_params",
        message:
          "royalty_params must include a numerator and denominator (or royalty_factor and royalty_base) and a destination address. TEP-62's royalty_params get method returns numerator, denominator, destination.",
      });
      return;
    }
    const numerator = royalty.numerator ?? royalty.royalty_factor ?? royalty.factor;
    const denominator = royalty.denominator ?? royalty.royalty_base ?? royalty.base;
    const destination = royalty.destination ?? royalty.royalty_address ?? royalty.address;
    if (
      typeof numerator !== "number" ||
      typeof denominator !== "number" ||
      !Number.isInteger(numerator) ||
      !Number.isInteger(denominator) ||
      numerator < 0 ||
      denominator <= 0 ||
      numerator > denominator
    ) {
      ctx.report({
        path: "royalty_params",
        message:
          "numerator and denominator must be integers, denominator > 0, and numerator <= denominator.",
      });
      return;
    }
    if (typeof destination !== "string" || !isTonAddress(destination)) {
      ctx.report({
        path: "royalty_params.destination",
        message:
          "destination (or royalty_address) must be a user-friendly TON address (EQ/UQ) or a raw 0: address.",
      });
    }
    const percent = (numerator / denominator) * 100;
    if (percent > ctx.config.royaltyWarnAbovePercent) {
      ctx.report({
        path: "royalty_params",
        severity: "warn",
        message: `Royalty is ${percent}%, above the ${ctx.config.royaltyWarnAbovePercent}% warning line.`,
      });
    }
  },
});

export const attributesRule = defineRule({
  id: "ton/attributes",
  chains: ["ton"],
  standards: ["tep-64"],
  severity: "error",
  docs: ruleDocUrl("ton/attributes"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("attributes" in ctx.json)) return;
    const attributes = ctx.json.attributes;
    if (!Array.isArray(attributes)) {
      ctx.report({
        path: "attributes",
        message: "attributes must be an array. Getgems expects {trait_type, value} objects.",
      });
      return;
    }
    attributes.forEach((attribute, index) => {
      const path = `attributes[${index}]`;
      if (!isRecord(attribute)) {
        ctx.report({ path, message: "Each attribute must be an object." });
        return;
      }
      const key = attribute.trait_type ?? attribute.name;
      if (typeof key !== "string" || key.trim() === "") {
        ctx.report({
          path: `${path}.trait_type`,
          message: "attribute needs trait_type (Getgems) or name.",
        });
      }
      if (
        !("value" in attribute) ||
        (typeof attribute.value !== "string" && typeof attribute.value !== "number")
      ) {
        ctx.report({
          path: `${path}.value`,
          message: "attribute value must be a string or a number.",
        });
      }
    });
  },
});

export const layoutRule = defineRule({
  id: "ton/layout",
  chains: ["ton"],
  standards: ["tep-64"],
  severity: "error",
  docs: ruleDocUrl("ton/layout"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json || !("content_layout" in json)) return;
    const layout = json.content_layout;
    if (layout !== 0 && layout !== 1 && layout !== "onchain" && layout !== "offchain") {
      ctx.report({
        path: "content_layout",
        message:
          "content_layout must be 0 (on-chain dictionary), 1 (off-chain URI), or the words onchain / offchain.",
      });
      return;
    }
    const offchain = layout === 1 || layout === "offchain";
    if (offchain && (typeof json.uri !== "string" || json.uri.trim() === "")) {
      ctx.report({
        path: "uri",
        message: "Off-chain content (prefix 0x01) must include the ASCII uri of the JSON document.",
      });
    }
    if (!offchain && typeof json.uri === "string" && Object.keys(json).length <= 2) {
      ctx.report({
        path: "content_layout",
        severity: "warn",
        message:
          "On-chain layout (prefix 0x00) stores a dictionary. A lone uri key is the semi-chain form; clients will fetch it and merge.",
      });
    }
  },
});

function isBase64(value: string): boolean {
  const body = value.replace(/^data:[^,]*,/, "");
  if (body.length === 0 || body.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(body);
}
