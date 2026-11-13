import type { RulePack } from "@nft-lint/core";
import { arc19Rule, arc3FieldsRule, arc3IntegrityRule, arc69Rule, asaLimitsRule } from "./rules.js";

export const algorandRules = [
  arc3FieldsRule,
  arc3IntegrityRule,
  arc19Rule,
  arc69Rule,
  asaLimitsRule,
];

export const pack: RulePack = {
  id: "algorand",
  status: "stable",
  standards: ["arc-3", "arc-19", "arc-69"],
  rules: algorandRules,
};

export { arc19Rule, arc3FieldsRule, arc3IntegrityRule, arc69Rule, asaLimitsRule };
