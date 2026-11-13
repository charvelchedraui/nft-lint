# algorand/arc69-json

**Severity:** see the rule pack. **Network:** not required

## What it checks

ARC-69 JSON from the asset-config note.

## Why it matters

standard must be the string arc69. properties is a flat object of trait name to value, not an array. media_url or image points at the file.

## How to fix

Set standard to arc69 and keep properties an object.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/algorand/arc69-json.md
