import type { RulePack } from "@nft-lint/core";
import { displayFieldsRule, kioskRule, templatesRule, urlsRule } from "./rules.js";

export const suiRules = [displayFieldsRule, templatesRule, urlsRule, kioskRule];

export const pack: RulePack = {
  id: "sui",
  status: "stable",
  standards: ["sui-display", "kiosk"],
  rules: suiRules,
};

export { displayFieldsRule, kioskRule, templatesRule, urlsRule };
