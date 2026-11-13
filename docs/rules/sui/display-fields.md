# sui/display-fields

**Severity:** see the rule pack. **Network:** not required

## What it checks

Display name, description, and image_url.

## Why it matters

Wallets read the Display object, not a generic image field. Without Display they show raw Move fields.

## How to fix

Set name, description, and image_url on the rendered display.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/sui/display-fields.md
