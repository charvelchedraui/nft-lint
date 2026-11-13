import type { Rule, RulePack } from "@nft-lint/core";

/**
 * Cardano CIP-25 and CIP-68 rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - CIP-25: metadata lives under the 721 label in the transaction metadata. Check name, image, mediaType, and files[].
 * - CIP-68: datum metadata (name, image, mediaType, description) referenced by the asset.
 * - Accept either a metadata JSON file or a policy id plus asset name. Use a public preview API only behind an opt-in network flag.
 * - Add fixtures for both standards and docs/rules/cardano/.
 */
export const cardanoRules: Rule[] = [];

export const pack: RulePack = {
  id: "cardano",
  status: "stub",
  standards: ["cip-25", "cip-68"],
  rules: cardanoRules,
};
