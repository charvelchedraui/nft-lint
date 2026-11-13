# flow/medias

**Severity:** see the rule pack. **Network:** not required

## What it checks

MetadataViews medias: file plus mediaType.

## Why it matters

A media entry is how a catalog shows a full image or video next to the thumbnail.

## How to fix

Each item needs file (HTTPFile or IPFSFile) and a type/subtype mediaType.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/flow/medias.md
