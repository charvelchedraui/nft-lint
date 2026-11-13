import type { RulePack } from "@nft-lint/core";
import { collectionRule, propertyMapRule, royaltyRule, tokenFieldsRule, uriRule } from "./rules.js";

export const aptosRules = [tokenFieldsRule, uriRule, collectionRule, propertyMapRule, royaltyRule];

export const pack: RulePack = {
  id: "aptos",
  status: "stable",
  standards: ["aptos-digital-asset"],
  rules: aptosRules,
};

export { collectionRule, propertyMapRule, royaltyRule, tokenFieldsRule, uriRule };
