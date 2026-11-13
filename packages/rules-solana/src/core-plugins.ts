import { defineRule, ruleDocUrl } from "@nft-lint/core";

export const corePluginsRule = defineRule({
  id: "solana/core-plugins",
  chains: ["solana"],
  standards: ["metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("solana/core-plugins"),
  needsNetwork: false,
  check(ctx) {
    const onChain = ctx.onChain;
    if (!onChain || onChain.kind !== "metaplex-core") return;
    if (!onChain.name || onChain.name.trim() === "") {
      ctx.report({ path: "name", message: "Metaplex Core asset is missing an on-chain name." });
    }
    if (!onChain.uri || onChain.uri.trim() === "") {
      ctx.report({ path: "uri", message: "Metaplex Core asset is missing an on-chain uri." });
    }
  },
});
