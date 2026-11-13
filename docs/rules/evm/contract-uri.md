# evm/contract-uri

**Severity:** see the rule pack. **Network:** not required

## What it checks

ERC-7572 contractURI JSON.

## Why it matters

Collection pages use this document for the name, image, and the royalty the creator thinks is set.

## How to fix

Return JSON with name and image. seller_fee_basis_points is an integer from 0 to 10000. fee_recipient is a 20-byte address.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/evm/contract-uri.md
