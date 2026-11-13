# ton/layout

**Severity:** see the rule pack. **Network:** not required

## What it checks

content_layout 0 or 1.

## Why it matters

0 is the on-chain dictionary. 1 is the off-chain URI and must include uri.

## How to fix

Set content_layout to 0 or 1, or to the words onchain or offchain, and include uri for off-chain content.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/ton/layout.md
