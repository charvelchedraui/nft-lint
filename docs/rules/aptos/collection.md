# aptos/collection

**Severity:** see the rule pack. **Network:** not required

## What it checks

Collection name, description, and uri when a collection object is present.

## Why it matters

The collection has its own uri, separate from the token uri. A page that only sets the token uri leaves the collection blank.

## How to fix

Set collection.name, description, and uri.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/aptos/collection.md
