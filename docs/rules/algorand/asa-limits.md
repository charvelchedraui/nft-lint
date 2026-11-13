# algorand/asa-limits

**Severity:** see the rule pack. **Network:** not required

## What it checks

ASA name, unit name, and URL byte lengths.

## Why it matters

Algorand stores the name in 32 bytes, the unit name in 8 bytes, and the URL in 96 bytes. The JSON name field is not the ASA name.

## How to fix

Shorten asset_name, unit_name, and url. These limits apply only when those fields are present.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/algorand/asa-limits.md
