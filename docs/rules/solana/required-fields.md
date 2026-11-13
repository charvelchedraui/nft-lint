# solana/required-fields

**Severity:** see the rule pack. **Network:** not required

## What it checks

Metaplex JSON required fields.

## Why it matters

Wallets expect name, symbol, description, image, attributes, and properties.files plus properties.category.

## How to fix

Add properties.files entries with uri and type, and a category of image, video, audio, vr, or html.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/solana/required-fields.md
