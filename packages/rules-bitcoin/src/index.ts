import type { RulePack } from "@nft-lint/core";
import { collectionRule, contentTypeRule, sizeRule } from "./collection.js";
import { inscriptionIdRule, requiredFieldsRule } from "./required.js";

export const bitcoinRules = [
  requiredFieldsRule,
  inscriptionIdRule,
  contentTypeRule,
  collectionRule,
  sizeRule,
];

export const pack: RulePack = {
  id: "bitcoin",
  status: "stable",
  standards: ["ordinals"],
  rules: bitcoinRules,
};

export { collectionRule, contentTypeRule, inscriptionIdRule, requiredFieldsRule, sizeRule };
