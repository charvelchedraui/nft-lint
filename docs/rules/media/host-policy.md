# media/host-policy

**Severity:** see the rule pack. **Network:** not required

## What it checks

Where the media is hosted.

## Why it matters

http:// is blocked by browsers. localhost is invisible to collectors. A normal website goes away when the server does.

## How to fix

Prefer ipfs:// or ar://. If you must use https, do not use localhost.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/media/host-policy.md
