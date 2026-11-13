import { defineRule, ercMetadataSchema, isRecord, ruleDocUrl, schemaIssues } from "@nft-lint/core";

export const requiredFieldsRule = defineRule({
  id: "evm/required-fields",
  chains: ["evm", "tron"],
  standards: ["erc-721", "erc-1155", "trc-721"],
  severity: "error",
  docs: ruleDocUrl("evm/required-fields"),
  needsNetwork: false,
  check(ctx) {
    if (!isRecord(ctx.value)) return;
    for (const issue of schemaIssues(ercMetadataSchema, ctx.value)) {
      ctx.report({ path: issue.path, message: issue.message });
    }
    if (ctx.value.description === "") {
      ctx.report({
        path: "description",
        severity: "warn",
        message: "description is empty. Marketplaces will show a blank token.",
      });
    }
  },
});
