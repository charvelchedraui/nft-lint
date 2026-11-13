# ton/attributes

**Severity:** see the rule pack. **Network:** not required

## What it checks

Getgems attributes.

## Why it matters

TEP-64 does not define attributes. Getgems reads trait_type and value.

## How to fix

Use an array of objects with trait_type or name, and a string or number value.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/ton/attributes.md
