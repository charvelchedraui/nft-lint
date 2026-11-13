import type { Rule, RulePack } from "@nft-lint/core";

/**
 * Bitcoin Ordinals rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - Accept an inscription id or a metadata JSON document used by Ordinals collections.
 * - Validate the inscription content type and that the metadata JSON points at an inscription content URL the indexer can resolve.
 * - Check collection metadata fields used by common Ordinals explorers (name, description, image or inscription id).
 * - Keep all HTTP calls behind NetworkClient. Do not require a paid ordinals API.
 * - Add pass and fail fixtures and a docs page per rule.
 */
export const bitcoinRules: Rule[] = [];

export const pack: RulePack = {
  id: "bitcoin",
  status: "stub",
  standards: ["ordinals"],
  rules: bitcoinRules,
};
