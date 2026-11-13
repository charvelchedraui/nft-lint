import { defineRule, ruleDocUrl } from "@nft-lint/core";

export const erc1155DecimalsRule = defineRule({
  id: "evm/erc1155-decimals",
  chains: ["evm"],
  standards: ["erc-1155"],
  severity: "error",
  docs: ruleDocUrl("evm/erc1155-decimals"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("decimals" in ctx.json)) return;
    const decimals = ctx.json.decimals;
    if (typeof decimals !== "number" || !Number.isInteger(decimals) || decimals < 0) {
      ctx.report({
        path: "decimals",
        message: "decimals must be a non-negative integer when it is present.",
      });
    }
  },
});
