# common/json

**Severity:** see the rule pack. **Network:** not required

## What it checks

Valid JSON object.

## Why it matters

Metadata that is not an object, is not JSON, or repeats a key will not display the way the author expects. JSON keeps the last duplicate and drops the rest.

## How to fix

Save UTF-8 without a BOM. Remove duplicate keys. The top level must be an object.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/common/json.md
