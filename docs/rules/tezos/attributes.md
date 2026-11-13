# tezos/attributes

**Severity:** see the rule pack. **Network:** not required

## What it checks

Attributes shaped as {name, value}.

## Why it matters

TZIP-21 does not use OpenSea trait_type. objkt drops traits that only have trait_type.

## How to fix

Rename trait_type to name. value is a string or a number.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tezos/attributes.md
