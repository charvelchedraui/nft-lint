# ton/royalty

**Severity:** see the rule pack. **Network:** not required

## What it checks

royalty_params as returned by the TEP-62 get method.

## Why it matters

The triple is numerator, denominator, and a destination address. The paid fraction is numerator/denominator.

## How to fix

Use integers with numerator <= denominator, and an EQ/UQ or raw 0: address.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/ton/royalty.md
