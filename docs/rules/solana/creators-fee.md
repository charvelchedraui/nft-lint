# solana/creators-fee

**Severity:** see the rule pack. **Network:** not required

## What it checks

Creator shares and seller fee.

## Why it matters

Metaplex requires creator shares to add up to 100. seller_fee_basis_points is an integer from 0 to 10000.

## How to fix

Make the shares add up to 100. 500 basis points is 5%.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/solana/creators-fee.md
