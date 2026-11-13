# solana/byte-lengths

**Severity:** see the rule pack. **Network:** not required

## What it checks

Metaplex on-chain string limits.

## Why it matters

name is 32 bytes, symbol is 10, uri is 200, counted in UTF-8. A longer string cannot be stored on chain.

## How to fix

Shorten the field. Emoji and non-ASCII characters cost more than one byte.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/solana/byte-lengths.md
