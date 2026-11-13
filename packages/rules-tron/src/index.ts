import type { RulePack } from "@nft-lint/core";
import { addressRule, idPlaceholderRule, tokenUriHtmlRule, tokenUriRule } from "./rules.js";

export const tronRules = [tokenUriRule, tokenUriHtmlRule, addressRule, idPlaceholderRule];

export const pack: RulePack = {
  id: "tron",
  status: "stable",
  standards: ["trc-721"],
  rules: tronRules,
};

export { addressRule, idPlaceholderRule, tokenUriHtmlRule, tokenUriRule };
