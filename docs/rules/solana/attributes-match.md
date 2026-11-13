# solana/attributes-match

**Severity:** see the rule pack. **Network:** not required

## What it checks

On-chain attributes match the JSON.

## Why it matters

Core and Token Metadata can store attributes in two places. If they disagree, wallets show one and marketplaces filter on the other.

## How to fix

Write the same trait_type and value in both places.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/solana/attributes-match.md
