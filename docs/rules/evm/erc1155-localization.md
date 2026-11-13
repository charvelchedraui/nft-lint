# evm/erc1155-localization

**Severity:** see the rule pack. **Network:** not required

## What it checks

ERC-1155 localization object, when present.

## Why it matters

Marketplaces look up {locale} and the default locale. A list that does not include the default never resolves.

## How to fix

uri must contain {locale}. default must be one of locales.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/evm/erc1155-localization.md
