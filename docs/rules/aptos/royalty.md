# aptos/royalty

**Severity:** see the rule pack. **Network:** not required

## What it checks

Royalty numerator, denominator, and payee_address.

## Why it matters

The percentage is numerator/denominator. The framework rejects a zero denominator and a numerator above the denominator.

## How to fix

Use a payee address (0x and up to 64 hex characters) and a numerator that does not exceed the denominator.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/aptos/royalty.md
