import { defineRule, isRecord, ruleDocUrl } from "@nft-lint/core";

const NUMERIC = new Set(["number", "boost_number", "boost_percentage", "date"]);

export const attributesRule = defineRule({
  id: "common/attributes",
  chains: ["*"],
  standards: ["erc-721", "erc-1155", "trc-721", "metaplex-token-metadata", "metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("common/attributes"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("attributes" in ctx.json)) return;
    const attributes = ctx.json.attributes;
    if (!Array.isArray(attributes)) {
      ctx.report({
        path: "attributes",
        message: "attributes must be an array of objects with trait_type and value.",
      });
      return;
    }
    const seen = new Map<string, number>();
    attributes.forEach((attribute, index) => {
      const path = `attributes[${index}]`;
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
      } else {
        seen.set(attribute.trait_type, (seen.get(attribute.trait_type) ?? 0) + 1);
      }
      if (!("value" in attribute)) {
        ctx.report({ path: `${path}.value`, message: "Attribute is missing value." });
      } else if (attribute.value === "") {
        ctx.report({
          path: `${path}.value`,
          severity: "warn",
          message: "Attribute value is empty.",
        });
      } else if (typeof attribute.value !== "string" && typeof attribute.value !== "number") {
        ctx.report({ path: `${path}.value`, message: "value must be a string or a number." });
      }
      if (attribute.display_type !== undefined) {
        checkDisplay(ctx, path, attribute.display_type, attribute.value);
      }
    });
    for (const [trait, count] of seen) {
      if (count > 1) {
        ctx.report({
          path: "attributes",
          severity: "warn",
          message: `Duplicate trait_type "${trait}" appears ${count} times. Marketplaces may keep only one.`,
        });
      }
    }
  },
});

function checkDisplay(
  ctx: Parameters<typeof attributesRule.check>[0],
  path: string,
  displayType: unknown,
  value: unknown,
) {
  if (typeof displayType !== "string" || !NUMERIC.has(displayType)) {
    ctx.report({
      path: `${path}.display_type`,
      message: "display_type must be one of number, boost_number, boost_percentage, date.",
    });
    return;
  }
  if (typeof value !== "number" || !Number.isFinite(value)) {
    ctx.report({
      path: `${path}.value`,
      message: `display_type "${displayType}" requires value to be a number, not a string.`,
    });
    return;
  }
  if (displayType !== "date") return;
  if (!Number.isInteger(value)) {
    ctx.report({
      path: `${path}.value`,
      message: "date display_type requires a whole unix timestamp in seconds.",
    });
    return;
  }
  if (value < 0) {
    ctx.report({ path: `${path}.value`, message: "date timestamp must not be negative." });
    return;
  }
  if (value > 10_000_000_000) {
    ctx.report({
      path: `${path}.value`,
      severity: "warn",
      message: "date looks like milliseconds. OpenSea expects a unix timestamp in seconds.",
    });
  }
}
