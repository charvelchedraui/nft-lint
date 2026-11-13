import type { Rule, RulePack } from "@nft-lint/core";

/**
 * Stargaze cw721 rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - Query cw721 token_info and contract_info via a public Stargaze LCD or RPC. No API key.
 * - token_uri should resolve to JSON with name or the collection's expected metadata fields, plus an image.
 * - Check royalty extension info when the contract exposes it.
 * - Add fixtures and docs/rules/stargaze/.
 */
export const stargazeRules: Rule[] = [];

export const pack: RulePack = {
  id: "stargaze",
  status: "stub",
  standards: ["cw721"],
  rules: stargazeRules,
};
