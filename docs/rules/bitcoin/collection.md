# bitcoin/collection

**Severity:** see the rule pack. **Network:** not required

## What it checks

Magic Eden style collection metadata: slug, supply, inscription_icon, and links.

## Why it matters

There is no on-chain collection contract. Marketplaces read this JSON. inscription_icon is an inscription id, not a URL.

## How to fix

Use a lowercase hyphenated slug, a positive supply, and https links.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/bitcoin/collection.md
