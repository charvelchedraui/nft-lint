# bitcoin/size

**Severity:** see the rule pack. **Network:** not required

## What it checks

content_length against a 400000 byte marketplace threshold.

## Why it matters

Bitcoin will confirm a larger inscription. Indexers and galleries often time out or refuse to render it. This is not a consensus limit.

## How to fix

Keep the content under 400000 bytes, or accept the warning.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/bitcoin/size.md
