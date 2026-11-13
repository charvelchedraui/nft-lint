# cardano/cip27-royalties

**Severity:** see the rule pack. **Network:** not required

## What it checks

CIP-27 label 777: rate and addr.

## Why it matters

rate is a decimal string from 0 to 1. addr is one payment address, split into 64-byte chunks when it does not fit. The legacy pct key is still read. Marketplaces honor the first mint of the empty-name token under the policy.

## How to fix

Mint the 777 token first. Use rate such as "0.05" and an addr1 or stake1 address.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/cardano/cip27-royalties.md
