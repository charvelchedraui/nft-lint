import type { Rule, RulePack } from "@nft-lint/core";

/**
 * TON TEP-64 rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - Read NFT item data (collection address, owner, content cell) from a public TON API or lite client. Prefer a documented public endpoint with no API key.
 * - Support off-chain content URIs and on-chain TEP-64 dictionaries.
 * - Require the metadata fields TEP-64 wallets expect: name, description, image, and optionally content_url / uri.
 * - Add fixtures for a valid item and for a missing image. Document the rule under docs/rules/ton/.
 */
export const tonRules: Rule[] = [];

export const pack: RulePack = {
  id: "ton",
  status: "stub",
  standards: ["tep-64"],
  rules: tonRules,
};
