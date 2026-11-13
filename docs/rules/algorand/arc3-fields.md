# algorand/arc3-fields

**Severity:** see the rule pack. **Network:** not required

## What it checks

ARC-3 name, description, image, and image_mimetype.

## Why it matters

image_mimetype must be image/*. {id} is the only placeholder, and it is lowercase. extra_metadata is base64 and changes the ASA metadata hash.

## How to fix

Set image to ipfs:// or https:// and image_mimetype to image/png or another image type.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/algorand/arc3-fields.md
