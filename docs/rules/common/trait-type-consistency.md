# common/trait-type-consistency

**Severity:** see the rule pack. **Network:** not required

## What it checks

The same trait uses one value type across a folder.

## Why it matters

OpenSea treats Hat as a string and Hat as a number as two different traits, which splits rarity.

## How to fix

Pick string or number for each trait_type and use it on every token. This check runs when the CLI is given a directory.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/common/trait-type-consistency.md
