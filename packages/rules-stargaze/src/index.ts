import type { RulePack } from "@nft-lint/core";
import { attributesRule, metadataRule, royaltyRule, tokenUriRule } from "./rules.js";

export const stargazeRules = [metadataRule, tokenUriRule, attributesRule, royaltyRule];

export const pack: RulePack = {
  id: "stargaze",
  status: "stable",
  standards: ["cw721", "sg721"],
  rules: stargazeRules,
};

export { attributesRule, metadataRule, royaltyRule, tokenUriRule };
