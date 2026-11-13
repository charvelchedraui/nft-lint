# tron/address

**Severity:** see the rule pack. **Network:** not required

## What it checks

The TRON base58check contract address.

## Why it matters

Mainnet addresses are 34 characters, start with T, and carry the 0x41 prefix plus a checksum.

## How to fix

Pass the base58 address, not the 41 hex form and not an Ethereum 0x address.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tron/address.md
