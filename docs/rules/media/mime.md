# media/mime

**Severity:** see the rule pack. **Network:** required

## What it checks

Bytes match the declared type and the extension.

## Why it matters

A URL that ends in .png but returns HTML or JPEG is rejected or mislabeled.

## How to fix

Set properties.files[].type to the real MIME type and use a matching extension.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/media/mime.md
