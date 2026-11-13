import type { Rule, RulePack } from "@nft-lint/core";

/**
 * Algorand ARC-3, ARC-19, and ARC-69 rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - ARC-3: JSON metadata URL, image, image_mimetype, image_integrity (SHA-256), and properties.
 * - ARC-19: template URLs with {id} substitution, similar in spirit to ERC-1155 but with Algorand asset ids.
 * - ARC-69: JSON metadata stored in the asset config note or a conventional off-chain document. Check standard, properties, and extra fields.
 * - Verify image_integrity against fetched bytes when the network is enabled.
 * - Add fixtures and docs/rules/algorand/.
 */
export const algorandRules: Rule[] = [];

export const pack: RulePack = {
  id: "algorand",
  status: "stub",
  standards: ["arc-3", "arc-19", "arc-69"],
  rules: algorandRules,
};
