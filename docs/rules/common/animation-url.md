# common/animation-url

**Severity:** see the rule pack. **Network:** not required

## What it checks

animation_url.

## Why it matters

An unparseable animation URL is dropped, so the token falls back to a still image or nothing.

## How to fix

Use an absolute ipfs://, ar://, or https:// URI.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/common/animation-url.md
