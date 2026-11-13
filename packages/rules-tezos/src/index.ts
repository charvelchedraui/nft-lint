import type { RulePack } from "@nft-lint/core";
import { attributesRule } from "./attributes.js";
import { creatorsRule } from "./creators.js";
import { formatsRule } from "./formats.js";
import { requiredFieldsRule } from "./required.js";
import { royaltiesRule } from "./royalties.js";
import { tzip16Rule } from "./tzip16.js";

export const tezosRules = [
  requiredFieldsRule,
  formatsRule,
  royaltiesRule,
  attributesRule,
  creatorsRule,
  tzip16Rule,
];

export const pack: RulePack = {
  id: "tezos",
  status: "stable",
  standards: ["tzip-12", "tzip-16", "tzip-21"],
  rules: tezosRules,
};

export { attributesRule, creatorsRule, formatsRule, requiredFieldsRule, royaltiesRule, tzip16Rule };
