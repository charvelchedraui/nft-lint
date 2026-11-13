import type { Rule, RulePack } from "@nft-lint/core";

/**
 * Tezos TZIP-21 and TZIP-16 rule pack.
 *
 * TODO(good-first-issue): this pack is a stub. It exports no rules yet.
 * See GOOD_FIRST_ISSUES.md and ROADMAP.md.
 *
 * - Read token metadata from TzKT (or Taquito) using the contract address and token id. Keep the HTTP client behind the shared NetworkClient so tests stay offline.
 * - Require name, artifactUri, displayUri, thumbnailUri, decimals (0 for a 1/1 NFT), and creators.
 * - Check formats[] entries for uri and mimeType. When fileSize or dimensions are present and the network is available, compare them to the fetched bytes.
 * - Check royalties.decimals and royalties.shares. Shares should be a sane fraction of the decimals scale.
 * - Check attributes as {name, value} (TZIP-21), not OpenSea trait_type.
 * - Type-check tags, rights, and isBooleanAmount when they are present.
 * - Add fixtures under fixtures/tezos/<rule-id>/ and a page under docs/rules/tezos/.
 */
export const tezosRules: Rule[] = [];

export const pack: RulePack = {
  id: "tezos",
  status: "stub",
  standards: ["tzip-21", "tzip-16"],
  rules: tezosRules,
};
