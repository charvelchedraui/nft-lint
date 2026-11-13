# tezos/creators

**Severity:** see the rule pack. **Network:** not required

## What it checks

minter and creators.

## Why it matters

objkt links a token to a profile only when creators contains a tezos address. Names are allowed beside that address. TZIP-21 requires the strings to be unique.

## How to fix

Put the creator tz address in creators, and set minter to the minting address.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tezos/creators.md
