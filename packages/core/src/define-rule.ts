import type { Rule } from "./types.js";

const RULE_ID =
  /^(common|evm|solana|media|tezos|bitcoin|ton|flow|tron|cardano|algorand|sui|aptos|stargaze)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function defineRule(rule: Rule): Rule {
  if (!RULE_ID.test(rule.id)) {
    throw new Error(
      `Rule id "${rule.id}" must look like "evm/erc721-required" (family prefix, kebab-case).`,
    );
  }
  if (!rule.docs) throw new Error(`Rule "${rule.id}" is missing docs.`);
  return rule;
}
