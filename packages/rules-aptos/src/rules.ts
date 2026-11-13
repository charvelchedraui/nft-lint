import {
  defineRule,
  isRecord,
  metadataUriIssue,
  ruleDocUrl,
  type RuleContext,
} from "@nft-lint/core";

const ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;
const NAME_WARN = 128;
const DESCRIPTION_MAX = 2048;
const URI_MAX = 512;
const PRIMITIVE = new Set([
  "bool",
  "u8",
  "u16",
  "u32",
  "u64",
  "u128",
  "u256",
  "address",
  "0x1::string::String",
  "vector<u8>",
  "vector<u64>",
  "vector<address>",
]);

/** Move u64 fields arrive as decimal strings from the fullnode. */
function integerField(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^(?:0|[1-9]\d*)$/.test(value)) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed)) return parsed;
  }
  return null;
}

function checkLength(
  ctx: RuleContext,
  path: string,
  value: string,
  max: number,
  label: string,
  severity: "error" | "warn",
) {
  if ([...value].length > max) {
    ctx.report({
      path,
      severity,
      message: `${label} is ${[...value].length} characters. The Digital Asset standard allows fewer than ${max}.`,
    });
  }
}

function checkUriField(ctx: RuleContext, path: string, value: unknown) {
  if (typeof value !== "string" || value.trim() === "") {
    ctx.report({ path, message: `${path} must be a non-empty URI.` });
    return;
  }
  checkLength(ctx, path, value, URI_MAX, path, "error");
  const issue = metadataUriIssue(value);
  if (issue) ctx.report({ path, message: `${path} ${issue}` });
}

export const tokenFieldsRule = defineRule({
  id: "aptos/token-fields",
  chains: ["aptos"],
  standards: ["aptos-digital-asset"],
  severity: "error",
  docs: ruleDocUrl("aptos/token-fields"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    if (typeof json.name !== "string" || json.name.trim() === "") {
      ctx.report({
        path: "name",
        message: "Token name is required and must be a non-empty string.",
      });
    } else {
      checkLength(ctx, "name", json.name, NAME_WARN, "name", "warn");
    }
    if (typeof json.description !== "string") {
      ctx.report({ path: "description", message: "description must be a string." });
    } else {
      if (json.description === "") {
        ctx.report({ path: "description", severity: "warn", message: "description is empty." });
      }
      checkLength(ctx, "description", json.description, DESCRIPTION_MAX, "description", "error");
    }
    const hasUri = typeof json.uri === "string" && json.uri.trim() !== "";
    const hasImage = typeof json.image === "string" && json.image.trim() !== "";
    if (!hasUri && !hasImage) {
      ctx.report({
        path: "uri",
        message:
          "A Digital Asset needs uri (the on-chain JSON link, under 512 characters) or image in the off-chain JSON.",
      });
    }
    if (hasImage && typeof json.image === "string") {
      const issue = metadataUriIssue(json.image);
      if (issue) ctx.report({ path: "image", message: `image ${issue}` });
    }
  },
});

export const uriRule = defineRule({
  id: "aptos/uri",
  chains: ["aptos"],
  standards: ["aptos-digital-asset"],
  severity: "error",
  docs: ruleDocUrl("aptos/uri"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("uri" in ctx.json)) return;
    checkUriField(ctx, "uri", ctx.json.uri);
  },
});

export const collectionRule = defineRule({
  id: "aptos/collection",
  chains: ["aptos"],
  standards: ["aptos-digital-asset"],
  severity: "error",
  docs: ruleDocUrl("aptos/collection"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("collection" in ctx.json)) return;
    const collection = ctx.json.collection;
    if (!isRecord(collection)) {
      ctx.report({
        path: "collection",
        message: "collection must be an object with name, description, and uri.",
      });
      return;
    }
    if (typeof collection.name !== "string" || collection.name.trim() === "") {
      ctx.report({ path: "collection.name", message: "collection name is required." });
    }
    if (typeof collection.description !== "string") {
      ctx.report({
        path: "collection.description",
        message: "collection description must be a string.",
      });
    } else {
      checkLength(
        ctx,
        "collection.description",
        collection.description,
        DESCRIPTION_MAX,
        "collection description",
        "error",
      );
    }
    if (!("uri" in collection)) {
      ctx.report({ path: "collection.uri", message: "collection uri is required." });
    } else {
      checkUriField(ctx, "collection.uri", collection.uri);
    }
  },
});

export const propertyMapRule = defineRule({
  id: "aptos/property-map",
  chains: ["aptos"],
  standards: ["aptos-digital-asset"],
  severity: "error",
  docs: ruleDocUrl("aptos/property-map"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json) return;
    const props = isRecord(ctx.json.properties)
      ? ctx.json.properties
      : isRecord(ctx.json.property_map)
        ? ctx.json.property_map
        : null;
    if (!props) return;
    if (!Array.isArray(props.keys) || !Array.isArray(props.values) || !Array.isArray(props.types)) {
      ctx.report({
        path: "properties",
        message: "property map must be {keys, values, types} arrays of equal length.",
      });
      return;
    }
    if (props.keys.length !== props.values.length || props.keys.length !== props.types.length) {
      ctx.report({
        path: "properties",
        message: `property map lengths differ: ${props.keys.length} keys, ${props.values.length} values, ${props.types.length} types.`,
      });
    }
    props.types.forEach((type, index) => {
      if (typeof type !== "string" || !PRIMITIVE.has(type)) {
        ctx.report({
          path: `properties.types[${index}]`,
          message: `property type "${String(type)}" is not a primitive PropertyMap type (bool, u64, address, 0x1::string::String, vector<u8>, ...).`,
        });
      }
    });
    props.keys.forEach((key, index) => {
      if (typeof key !== "string" || key.trim() === "") {
        ctx.report({
          path: `properties.keys[${index}]`,
          message: "Each property key must be a non-empty string.",
        });
      }
    });
  },
});

export const royaltyRule = defineRule({
  id: "aptos/royalty",
  chains: ["aptos"],
  standards: ["aptos-digital-asset"],
  severity: "error",
  docs: ruleDocUrl("aptos/royalty"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("royalty" in ctx.json)) return;
    const royalty = ctx.json.royalty;
    if (!isRecord(royalty)) {
      ctx.report({
        path: "royalty",
        message: "royalty must be {numerator, denominator, payee_address}.",
      });
      return;
    }
    const numerator = integerField(royalty.numerator ?? royalty.royalty_points_numerator);
    const denominator = integerField(royalty.denominator ?? royalty.royalty_points_denominator);
    const payee = royalty.payee_address;
    if (
      numerator === null ||
      denominator === null ||
      denominator === 0 ||
      numerator < 0 ||
      numerator > denominator
    ) {
      ctx.report({
        path: "royalty",
        message:
          "Royalty numerator must be an integer from 0 to denominator, and denominator must not be 0.",
      });
      return;
    }
    if (typeof payee !== "string" || !ADDRESS.test(payee)) {
      ctx.report({
        path: "royalty.payee_address",
        message: "payee_address must be an Aptos address (0x and up to 64 hex characters).",
      });
    }
    const percent = (numerator / denominator) * 100;
    if (percent > ctx.config.royaltyWarnAbovePercent) {
      ctx.report({
        path: "royalty",
        severity: "warn",
        message: `Royalty is ${percent}%, above the ${ctx.config.royaltyWarnAbovePercent}% warning line.`,
      });
    }
  },
});
