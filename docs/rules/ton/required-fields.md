# ton/required-fields

**Severity:** see the rule pack. **Network:** not required

## What it checks

TEP-64 name, description, and image or image_data.

## Why it matters

Wallets and Getgems display those fields. image is a URI. image_data is base64 in off-chain JSON.

## How to fix

Set name, description, and image to an ipfs:// or https:// URI.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/ton/required-fields.md
