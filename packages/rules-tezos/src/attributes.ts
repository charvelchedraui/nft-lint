import { defineRule, isRecord, ruleDocUrl } from "@nft-lint/core";

export const attributesRule = defineRule({
  id: "tezos/attributes",
  chains: ["tezos"],
  standards: ["tzip-21"],
  severity: "error",
  docs: ruleDocUrl("tezos/attributes"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("attributes" in ctx.json)) return;
    const attributes = ctx.json.attributes;
    if (!Array.isArray(attributes)) {
      ctx.report({
        path: "attributes",
        message:
          "attributes must be an array of {name, value} objects. TZIP-21 does not use trait_type.",
      });
      return;
    }
    const seen = new Map<string, number>();
    attributes.forEach((attribute, index) => {
      const path = `attributes[${index}]`;
      if (!isRecord(attribute)) {
        ctx.report({ path, message: "Each attribute must be an object with name and value." });
        return;
      }
      if ("trait_type" in attribute && !("name" in attribute)) {
        ctx.report({
          path: `${path}.name`,
          message:
            "TZIP-21 attributes use name, not OpenSea trait_type. objkt will drop this trait.",
        });
      }
      if (typeof attribute.name !== "string" || attribute.name.trim() === "") {
        ctx.report({ path: `${path}.name`, message: "attribute name must be a non-empty string." });
      } else {
        seen.set(attribute.name, (seen.get(attribute.name) ?? 0) + 1);
      }
      if (!("value" in attribute)) {
        ctx.report({ path: `${path}.value`, message: "attribute is missing value." });
      } else if (attribute.value === "") {
        ctx.report({
          path: `${path}.value`,
          severity: "warn",
          message: "attribute value is empty.",
        });
      } else if (typeof attribute.value !== "string" && typeof attribute.value !== "number") {
        ctx.report({
          path: `${path}.value`,
          message: "attribute value must be a string or a number.",
        });
      }
    });
    for (const [name, count] of seen) {
      if (count > 1) {
        ctx.report({
          path: "attributes",
          severity: "warn",
          message: `Duplicate attribute name "${name}" appears ${count} times.`,
        });
      }
    }
  },
});
