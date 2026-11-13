# tezos/required-fields

**Severity:** see the rule pack. **Network:** not required

## What it checks

decimals, name or symbol, and the NFT URIs artifactUri, displayUri, and thumbnailUri.

## Why it matters

TZIP-21 makes decimals required. objkt and teia also need the three URIs or the token has no file to show. isBooleanAmount should be true when decimals is 0 so FA2 wallets treat the balance as one NFT.

## How to fix

Set decimals to 0, isBooleanAmount to true, and point each URI at ipfs:// or ar://.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tezos/required-fields.md
