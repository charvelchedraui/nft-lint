import { defineRule, inspectErc1155Uri, ruleDocUrl, type OnChainFacts } from "@nft-lint/core";

function tokenUri(onChain: OnChainFacts | null, uri: string | undefined): string | undefined {
  if (onChain && (onChain.kind === "erc-721" || onChain.kind === "erc-1155") && onChain.tokenUri) {
    return onChain.tokenUri;
  }
  return uri;
}

export const erc1155IdRule = defineRule({
  id: "evm/erc1155-id",
  chains: ["evm"],
  standards: ["erc-1155"],
  severity: "error",
  docs: ruleDocUrl("evm/erc1155-id"),
  needsNetwork: false,
  check(ctx) {
    const uri = tokenUri(ctx.onChain, ctx.uri);
    if (!uri) return;
    const inspected = inspectErc1155Uri(uri, ctx.tokenId);
    if (inspected.badPlaceholders.length === 0 && !uri.includes("{id}") && !uri.includes("{ID}")) {
      return;
    }
    for (const placeholder of inspected.badPlaceholders) {
      ctx.report({
        path: "uri",
        message: `ERC-1155 placeholder ${placeholder} is invalid. Use the exact lowercase token {id}. Clients replace it with 64 lowercase hex characters and no 0x prefix.`,
      });
    }
    if (ctx.tokenId !== undefined && uri.includes("{id}") && !inspected.idHex) {
      ctx.report({
        path: "tokenId",
        message: `Token id "${ctx.tokenId}" is not an integer, so {id} cannot be substituted.`,
      });
    }
  },
});
