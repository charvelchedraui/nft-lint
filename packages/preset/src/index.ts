import { builtinRules, lint as lintWith, type LintInput, type LintOptions } from "@nft-lint/core";
import { evmRules } from "@nft-lint/rules-evm";
import { mediaRules } from "@nft-lint/rules-media";
import { solanaRules } from "@nft-lint/rules-solana";

export const defaultRules = [...builtinRules, ...evmRules, ...solanaRules, ...mediaRules];

export async function lint(input: string | LintInput, options: LintOptions = {}) {
  return lintWith(input, { ...options, rules: options.rules ?? defaultRules });
}

export { defaultRules as rules };
