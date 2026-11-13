# tezos/tzip16

**Severity:** see the rule pack. **Network:** not required

## What it checks

TZIP-16 contract metadata: interfaces and views.

## Why it matters

This is the contract document, not the per-token TZIP-21 JSON. A view without an implementation cannot be called.

## How to fix

List interfaces such as TZIP-016 and TZIP-012. Each view needs a name and implementations.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tezos/tzip16.md
