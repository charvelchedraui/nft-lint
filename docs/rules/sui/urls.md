# sui/urls

**Severity:** see the rule pack. **Network:** not required

## What it checks

image_url, thumbnail_url, project_url, and link.

## Why it matters

The chain stores these as strings and does not check that they are URLs. http:// and relative paths do not load in a wallet.

## How to fix

Use https://, ipfs://, or ar://. A value that still contains {field} is left to the template check.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/sui/urls.md
