import { defineRule, isRecord, metadataUriIssue, ruleDocUrl } from "@nft-lint/core";

/**
 * TZIP-16 is the contract metadata document (views, interfaces), not the
 * per-token TZIP-21 JSON. The check runs when those fields are present.
 */
export const tzip16Rule = defineRule({
  id: "tezos/tzip16",
  chains: ["tezos"],
  standards: ["tzip-16", "tzip-21"],
  severity: "error",
  docs: ruleDocUrl("tezos/tzip16"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    if (!("interfaces" in json) && !("views" in json)) return;
    if ("interfaces" in json) {
      if (
        !Array.isArray(json.interfaces) ||
        json.interfaces.some((item) => typeof item !== "string")
      ) {
        ctx.report({
          path: "interfaces",
          message: 'interfaces must be an array of strings such as "TZIP-012" and "TZIP-016".',
        });
      } else if (ctx.standard === "tzip-16") {
        const names = json.interfaces.map((item) => item.toUpperCase());
        if (!names.some((name) => name.includes("TZIP-016") || name.includes("TZIP-16"))) {
          ctx.report({
            path: "interfaces",
            severity: "warn",
            message:
              "Contract metadata should list TZIP-016 so indexers treat this document as TZIP-16.",
          });
        }
      }
    }
    if (!("views" in json)) return;
    if (!Array.isArray(json.views)) {
      ctx.report({ path: "views", message: "views must be an array of view objects." });
      return;
    }
    json.views.forEach((view, index) => {
      const path = `views[${index}]`;
      if (!isRecord(view)) {
        ctx.report({
          path,
          message: "Each view must be an object with a name and an implementation.",
        });
        return;
      }
      if (typeof view.name !== "string" || view.name.trim() === "") {
        ctx.report({ path: `${path}.name`, message: "view name must be a non-empty string." });
      }
      const implementations = view.implementations ?? view.implementation;
      const list = Array.isArray(implementations)
        ? implementations
        : implementations
          ? [implementations]
          : [];
      if (list.length === 0) {
        ctx.report({
          path: `${path}.implementations`,
          message: "Each TZIP-16 view needs implementations (or a single implementation object).",
        });
        return;
      }
      list.forEach((implementation, impl) => {
        if (!isRecord(implementation)) {
          ctx.report({
            path: `${path}.implementations[${impl}]`,
            message:
              "A view implementation must be an object, such as michelsonStorageView or restApiQuery.",
          });
          return;
        }
        const rest = isRecord(implementation.restApiQuery) ? implementation.restApiQuery : null;
        if (rest && typeof rest.specificationUri === "string") {
          const issue = metadataUriIssue(rest.specificationUri);
          if (issue) {
            ctx.report({
              path: `${path}.implementations[${impl}].restApiQuery.specificationUri`,
              message: `specificationUri ${issue}`,
            });
          }
        }
      });
    });
    if ("homepage" in json && typeof json.homepage === "string") {
      const issue = metadataUriIssue(json.homepage);
      if (issue) ctx.report({ path: "homepage", message: `homepage ${issue}` });
    }
  },
});
