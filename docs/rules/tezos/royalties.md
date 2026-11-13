# tezos/royalties

**Severity:** see the rule pack. **Network:** not required

## What it checks

The objkt royalties object: decimals plus shares keyed by tezos address.

## Why it matters

A share is an integer on a 10^decimals scale. 50 with decimals 3 is 5%. A name in shares cannot be paid.

## How to fix

Use tz1, tz2, tz3, tz4, or KT1 keys. Keep the sum at or below 10^decimals.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tezos/royalties.md
