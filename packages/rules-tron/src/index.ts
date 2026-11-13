import type { Rule, RulePack } from "@nft-lint/core";

/**
 * Tron TRC-721 rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - TRC-721 is close to ERC-721. Add a Tron chain entry (chain id, public full-node URL, explorer) and a reader that calls tokenURI.
 * - Reuse the EVM JSON rules where the metadata shape matches, and add Tron-specific differences instead of copying every check.
 * - Cover a valid tokenURI and a tokenURI that returns HTML. Add docs/rules/tron/.
 */
export const tronRules: Rule[] = [];

export const pack: RulePack = {
  id: "tron",
  status: "stub",
  standards: ["trc-721"],
  rules: tronRules,
};
