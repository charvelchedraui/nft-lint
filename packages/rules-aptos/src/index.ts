import type { Rule, RulePack } from "@nft-lint/core";

/**
 * Aptos Digital Asset rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - Read the token object (Digital Asset / token v2) from a public Aptos fullnode.
 * - Check token name, uri, and the JSON document it points at (name, description, image).
 * - Check property map types when present.
 * - Add fixtures and docs/rules/aptos/.
 */
export const aptosRules: Rule[] = [];

export const pack: RulePack = {
  id: "aptos",
  status: "stub",
  standards: ["aptos-digital-asset"],
  rules: aptosRules,
};
