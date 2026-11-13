# bitcoin/content-type

**Severity:** see the rule pack. **Network:** not required

## What it checks

The inscription content type.

## Why it matters

ord stores the MIME type in a tag. Marketplaces use it to choose an image, HTML, or JSON renderer.

## How to fix

Use a type such as image/png, text/html, or application/json.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/bitcoin/content-type.md
