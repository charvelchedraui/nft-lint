# solana/image-in-files

**Severity:** see the rule pack. **Network:** not required

## What it checks

image is listed in properties.files.

## Why it matters

Without a files entry, the wallet does not know the MIME type and may refuse to render the image.

## How to fix

Repeat the image URI in properties.files with an image/* type.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/solana/image-in-files.md
