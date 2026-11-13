# evm/erc1155-decimals

**Severity:** see the rule pack. **Network:** not required

## What it checks

ERC-1155 decimals, when present.

## Why it matters

A string or a negative decimals value breaks clients that treat the item as a quantity.

## How to fix

Use a non-negative integer. 1/1 items use 0. Omit the field if you do not need it.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/evm/erc1155-decimals.md
