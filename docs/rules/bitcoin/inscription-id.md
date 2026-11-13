# bitcoin/inscription-id

**Severity:** see the rule pack. **Network:** not required

## What it checks

Inscription ids, parent, delegate, and /content/ recursion.

## Why it matters

An inscription id is 64 lowercase hex characters, the letter i, and an index. Parent/child provenance and recursive /content/ endpoints only resolve that form.

## How to fix

Copy the id from the indexer. Do not shorten it or add 0x.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/bitcoin/inscription-id.md
