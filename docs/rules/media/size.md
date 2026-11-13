# media/size

**Severity:** see the rule pack. **Network:** required

## What it checks

Image and thumbnail size.

## Why it matters

Images over 10 MB and thumbnails over 1 MB are slow or rejected. Both limits are configurable.

## How to fix

Compress the file or raise maxImageBytes in nft-lint.config.json.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/media/size.md
