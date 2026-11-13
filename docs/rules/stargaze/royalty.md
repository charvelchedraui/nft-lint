# stargaze/royalty

**Severity:** see the rule pack. **Network:** not required

## What it checks

sg721 royalty_info share and payment_address.

## Why it matters

share is a decimal string. 0.05 is 5%, not 5 basis points. The contract rejects a share above 0.10. payment_address is a bech32 address with a valid checksum, prefixed stars on the original chain or cosmos on the Cosmos Hub.

## How to fix

Set share to 0.10 or less and payment_address to a stars1 or cosmos1 address whose checksum matches.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/stargaze/royalty.md
