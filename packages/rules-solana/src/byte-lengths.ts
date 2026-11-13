import { defineRule, ruleDocUrl, utf8ByteLength } from "@nft-lint/core";

export const byteLengthsRule = defineRule({
  id: "solana/byte-lengths",
  chains: ["solana"],
  standards: ["metaplex-token-metadata", "metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("solana/byte-lengths"),
  needsNetwork: false,
  check(ctx) {
    if (ctx.json) {
      reportLength(ctx, "name", ctx.json.name, 32, "name");
      reportLength(ctx, "symbol", ctx.json.symbol, 10, "symbol");
    }
    const onChain = ctx.onChain;
    if (
      !onChain ||
      (onChain.kind !== "metaplex-token-metadata" && onChain.kind !== "metaplex-core")
    ) {
      return;
    }
    reportLength(ctx, "onChain.name", onChain.name, 32, "On-chain name");
    if (onChain.kind === "metaplex-token-metadata") {
      reportLength(ctx, "onChain.symbol", onChain.symbol, 10, "On-chain symbol");
    }
    reportLength(ctx, "onChain.uri", onChain.uri, 200, "On-chain uri");
  },
});

function reportLength(
  ctx: Parameters<typeof byteLengthsRule.check>[0],
  path: string,
  value: unknown,
  max: number,
  label: string,
) {
  if (typeof value !== "string") return;
  const bytes = utf8ByteLength(value);
  if (bytes > max) {
    ctx.report({
      path,
      message: `${label} is ${bytes} UTF-8 bytes. Metaplex allows ${max} on chain.`,
    });
  }
}
