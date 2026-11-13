# bitcoin/required-fields

**Severity:** see the rule pack. **Network:** not required

## What it checks

name, plus image or an inscription id.

## Why it matters

Ordinals explorers and Magic Eden title an item from name and render either the inscription or an image URI.

## How to fix

Set name. Set inscription_id, inscription_icon, or an ipfs:// image.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/bitcoin/required-fields.md
