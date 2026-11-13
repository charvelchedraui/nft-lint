# tezos/formats

**Severity:** see the rule pack. **Network:** not required

## What it checks

formats[] entries for uri, mimeType, and optional hash, fileSize, and dimensions.

## Why it matters

Indexers pick a rendition from formats when artifactUri is a model or a video and the preview is a still.

## How to fix

Add one object per file. mimeType is a type/subtype string. hash, when set, is 64 hex characters.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/tezos/formats.md
