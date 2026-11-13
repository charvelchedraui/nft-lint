# tron/token-uri

**Severity:** see the rule pack. **Network:** not required

## What it checks

TRC-721 tokenURI.

## Why it matters

The metadata extension returns one URI per token. A Tronscan page is HTML, not the JSON file.

## How to fix

Point tokenURI at ipfs:// or https JSON. Do not paste the explorer URL.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tron/token-uri.md
