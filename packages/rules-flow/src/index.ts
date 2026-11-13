import type { RulePack } from "@nft-lint/core";
import {
  collectionDisplayRule,
  displayRule,
  editionsRule,
  mediasRule,
  royaltiesRule,
  traitsRule,
} from "./rules.js";

export const flowRules = [
  displayRule,
  mediasRule,
  royaltiesRule,
  editionsRule,
  traitsRule,
  collectionDisplayRule,
];

export const pack: RulePack = {
  id: "flow",
  status: "stable",
  standards: ["metadata-views"],
  rules: flowRules,
};

export { collectionDisplayRule, displayRule, editionsRule, mediasRule, royaltiesRule, traitsRule };
