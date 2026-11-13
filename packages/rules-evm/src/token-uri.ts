import { defineRule, ruleDocUrl } from "@nft-lint/core";

export const tokenUriRule = defineRule({
  id: "evm/token-uri",
  chains: ["evm"],
  standards: ["erc-721", "erc-1155"],
  severity: "error",
  docs: ruleDocUrl("evm/token-uri"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.contract || ctx.fetchError) return;
    const onChain = ctx.onChain;
    if (!onChain || (onChain.kind !== "erc-721" && onChain.kind !== "erc-1155")) return;
    if (!onChain.tokenUri || onChain.tokenUri.trim() === "") {
      ctx.report({
        path: "tokenURI",
        message: "The contract did not return a tokenURI or uri.",
      });
    }
  },
});
