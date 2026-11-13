# solana/core-plugins

**Severity:** see the rule pack. **Network:** not required

## What it checks

Metaplex Core on-chain name and uri.

## Why it matters

A Core asset without a name or uri cannot point at metadata.

## How to fix

Set both on the asset. Royalties and attributes plugins are checked by the other Solana rules when they are present.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/solana/core-plugins.md
