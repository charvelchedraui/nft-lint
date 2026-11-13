# aptos/property-map

**Severity:** see the rule pack. **Network:** not required

## What it checks

PropertyMap keys, values, and types.

## Why it matters

The three arrays must be the same length. Types are primitives: bool, u64, address, 0x1::string::String, vector<u8>, and the other integer widths.

## How to fix

Keep the arrays aligned and use a primitive type tag.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/aptos/property-map.md
