# tron/id-placeholder

**Severity:** see the rule pack. **Network:** not required

## What it checks

A {id} placeholder in TRC-721 fields.

## Why it matters

TRC-1155 substitutes {id}. TRC-721 tokenURI is one document per token and does not substitute.

## How to fix

Remove {id} from image, animation_url, external_url, and tokenURI.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tron/id-placeholder.md
