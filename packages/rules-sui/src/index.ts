import type { Rule, RulePack } from "@nft-lint/core";

/**
 * Sui Display rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - Read the Display object for a Sui NFT type from a public fullnode. No API key.
 * - Check the required Display fields (name, description, image_url or the project's equivalent) and that template variables such as {name} were substituted.
 * - Compare on-chain Display fields with off-chain JSON when a metadata URL is present.
 * - Add fixtures and docs/rules/sui/.
 */
export const suiRules: Rule[] = [];

export const pack: RulePack = {
  id: "sui",
  status: "stub",
  standards: ["sui-display"],
  rules: suiRules,
};
