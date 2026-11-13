# common/metadata-fetch

**Severity:** see the rule pack. **Network:** not required

## What it checks

The metadata document can be fetched.

## Why it matters

A tokenURI that 404s or returns HTML leaves the token blank on every marketplace.

## How to fix

Re-run without --offline for remote targets. Return JSON with a 200 status.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/common/metadata-fetch.md
