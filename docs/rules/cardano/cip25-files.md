# cardano/cip25-files

**Severity:** see the rule pack. **Network:** not required

## What it checks

files[] mediaType and src.

## Why it matters

CIP-25 requires mediaType on each file. src is a URI or a chunk array, same rules as image.

## How to fix

Add mediaType and src to every file.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/cardano/cip25-files.md
