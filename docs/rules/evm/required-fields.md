# evm/required-fields

**Severity:** see the rule pack. **Network:** not required

## What it checks

name, description, and image.

## Why it matters

ERC-721 and ERC-1155 metadata is not shown when these are missing or the wrong type.

## How to fix

Add non-empty string name and image, and a string description.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/evm/required-fields.md
