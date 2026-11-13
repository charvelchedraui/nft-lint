# flow/royalties

**Severity:** see the rule pack. **Network:** not required

## What it checks

MetadataViews royalties: receiver, cut, and description.

## Why it matters

cut is a fraction from 0 to 1, not basis points. The Cadence constructor rejects a cut outside that range.

## How to fix

Use a Flow address (0x and up to 16 hex characters) and a cut such as 0.05.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/flow/royalties.md
