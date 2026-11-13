# ton/content-uri

**Severity:** see the rule pack. **Network:** not required

## What it checks

uri, content_url, and video.

## Why it matters

Off-chain content is a 0x01 cell plus an ASCII URI. Semi-chain content puts uri in the on-chain dictionary and merges it with the fetched JSON. content_url is the Getgems animation or HTML field.

## How to fix

Use an absolute ipfs://, ar://, or https:// URI.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/ton/content-uri.md
