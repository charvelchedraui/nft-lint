# cardano/cip25-asset

**Severity:** see the rule pack. **Network:** not required

## What it checks

CIP-25 label 721: policy id, name, and image.

## Why it matters

The policy id is 28 bytes, written as 56 hex characters. name and image are required. mediaType is optional and worth setting.

## How to fix

Put the asset under 721, then the policy id, then the asset name.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/cardano/cip25-asset.md
