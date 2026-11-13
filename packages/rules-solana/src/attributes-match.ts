import { defineRule, isRecord, ruleDocUrl } from "@nft-lint/core";

export const attributesMatchRule = defineRule({
  id: "solana/attributes-match",
  chains: ["solana"],
  standards: ["metaplex-token-metadata", "metaplex-core"],
  severity: "warn",
  docs: ruleDocUrl("solana/attributes-match"),
  needsNetwork: false,
  check(ctx) {
    const onChain = ctx.onChain;
    if (
      !onChain ||
      (onChain.kind !== "metaplex-token-metadata" && onChain.kind !== "metaplex-core") ||
      !onChain.attributes ||
      !Array.isArray(ctx.json?.attributes)
    ) {
      return;
    }
    const off = canon(ctx.json.attributes);
    const on = canon(onChain.attributes);
    const traits = new Set([...off.keys(), ...on.keys()]);
    const mismatches: string[] = [];
    for (const trait of traits) {
      if (off.get(trait) !== on.get(trait)) {
        mismatches.push(
          `${trait} (json ${off.has(trait) ? JSON.stringify(off.get(trait)) : "missing"}, on-chain ${on.has(trait) ? JSON.stringify(on.get(trait)) : "missing"})`,
        );
      }
    }
    if (mismatches.length > 0) {
      ctx.report({
        path: "attributes",
        message: `On-chain attributes do not match the JSON: ${mismatches.join("; ")}.`,
      });
    }
  },
});

function canon(attributes: unknown[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const attribute of attributes) {
    if (!isRecord(attribute) || typeof attribute.trait_type !== "string") continue;
    if (attribute.value === undefined) continue;
    map.set(attribute.trait_type, String(attribute.value));
  }
  return map;
}
