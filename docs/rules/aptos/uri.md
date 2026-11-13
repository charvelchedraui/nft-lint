# aptos/uri

**Severity:** see the rule pack. **Network:** not required

## What it checks

The on-chain token or collection uri.

## Why it matters

Wallets fetch this URI for the JSON document. A relative path or an http:// URL will not load.

## How to fix

Use ipfs://, ar://, or https://, and keep it under 512 characters.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/aptos/uri.md
