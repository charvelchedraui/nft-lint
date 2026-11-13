# flow/editions

**Severity:** see the rule pack. **Network:** not required

## What it checks

MetadataViews editions: number and optional max.

## Why it matters

number is the edition index, starting at 1. It cannot be greater than max. An open edition omits max.

## How to fix

Set number and, for a limited edition, max >= number.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/flow/editions.md
