import { builtinRules, lint as lintWith, type LintInput, type LintOptions } from "@nft-lint/core";
import { algorandRules } from "@nft-lint/rules-algorand";
import { aptosRules } from "@nft-lint/rules-aptos";
import { bitcoinRules } from "@nft-lint/rules-bitcoin";
import { cardanoRules } from "@nft-lint/rules-cardano";
import { evmRules } from "@nft-lint/rules-evm";
import { flowRules } from "@nft-lint/rules-flow";
import { mediaRules } from "@nft-lint/rules-media";
import { solanaRules } from "@nft-lint/rules-solana";
import { stargazeRules } from "@nft-lint/rules-stargaze";
import { suiRules } from "@nft-lint/rules-sui";
import { tezosRules } from "@nft-lint/rules-tezos";
import { tonRules } from "@nft-lint/rules-ton";
import { tronRules } from "@nft-lint/rules-tron";

export const defaultRules = [
  ...builtinRules,
  ...evmRules,
  ...solanaRules,
  ...mediaRules,
  ...tezosRules,
  ...bitcoinRules,
  ...tonRules,
  ...flowRules,
  ...tronRules,
  ...cardanoRules,
  ...algorandRules,
  ...suiRules,
  ...aptosRules,
  ...stargazeRules,
];

export async function lint(input: string | LintInput, options: LintOptions = {}) {
  return lintWith(input, { ...options, rules: options.rules ?? defaultRules });
}

export { defaultRules as rules };
