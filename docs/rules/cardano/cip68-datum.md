# cardano/cip68-datum

**Severity:** see the rule pack. **Network:** not required

## What it checks

CIP-68 datum metadata: version, name, image, and mediaType.

## Why it matters

The datum is metadata, a version from 1 to 4, and extra plutus data. Versions 1 to 3 use the CIP-25 fields directly. Version 4 may nest them under a 721 map. Reference NFTs use the CIP-67 label prefix 000643b0 and user tokens use 000de140.

## How to fix

Set version to 1, 2, 3, or 4, and include name and image.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/cardano/cip68-datum.md
