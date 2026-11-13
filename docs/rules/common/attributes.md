# common/attributes

**Severity:** see the rule pack. **Network:** not required

## What it checks

OpenSea-style attributes.

## Why it matters

Trait filters drop attributes that are not {trait_type, value}. Dates in milliseconds land in the year 50000.

## How to fix

Use trait_type plus a string or number value. display_type date is a unix timestamp in seconds. Do not repeat a trait_type.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/common/attributes.md
