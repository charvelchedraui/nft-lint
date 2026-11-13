import type { Rule, RulePack } from "@nft-lint/core";

/**
 * Flow MetadataViews rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - Read Cadence MetadataViews (Display, HTTPFile, IPFSFile, Royalties, Traits) from a public Flow access node.
 * - Also note Flow EVM as a later follow-up: EVM-shaped metadata can reuse @nft-lint/rules-evm once a Flow EVM chain entry exists.
 * - Check Display.name, Display.description, and a media file view. Check royalty receivers.
 * - Add fixtures and docs/rules/flow/.
 */
export const flowRules: Rule[] = [];

export const pack: RulePack = {
  id: "flow",
  status: "stub",
  standards: ["metadata-views"],
  rules: flowRules,
};
