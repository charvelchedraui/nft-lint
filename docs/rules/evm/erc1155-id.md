# evm/erc1155-id

**Severity:** see the rule pack. **Network:** not required

## What it checks

ERC-1155 {id} substitution.

## Why it matters

The spec requires the exact lowercase token {id}, replaced with 64 hex characters and no 0x prefix. {ID} is a different string and will not be substituted.

## How to fix

Use {id}. Pad the token id with leading zeros to 64 lowercase hex digits when you substitute it yourself.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/evm/erc1155-id.md
