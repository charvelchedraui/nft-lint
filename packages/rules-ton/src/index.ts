import type { RulePack } from "@nft-lint/core";
import {
  attributesRule,
  contentUriRule,
  layoutRule,
  requiredFieldsRule,
  royaltyRule,
} from "./rules.js";

export const tonRules = [
  requiredFieldsRule,
  contentUriRule,
  royaltyRule,
  attributesRule,
  layoutRule,
];

export const pack: RulePack = {
  id: "ton",
  status: "stable",
  standards: ["tep-62", "tep-64"],
  rules: tonRules,
};

export { attributesRule, contentUriRule, layoutRule, requiredFieldsRule, royaltyRule };
