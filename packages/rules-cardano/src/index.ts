import type { RulePack } from "@nft-lint/core";
import { cip25AssetRule, cip25ChunksRule, cip25FilesRule, cip27Rule, cip68Rule } from "./rules.js";

export const cardanoRules = [cip25AssetRule, cip25ChunksRule, cip25FilesRule, cip68Rule, cip27Rule];

export const pack: RulePack = {
  id: "cardano",
  status: "stable",
  standards: ["cip-25", "cip-27", "cip-68"],
  rules: cardanoRules,
};

export { cip25AssetRule, cip25ChunksRule, cip25FilesRule, cip27Rule, cip68Rule };
