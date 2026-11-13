# stargaze/metadata

**Severity:** see the rule pack. **Network:** not required

## What it checks

sg721 name and image or token_uri.

## Why it matters

nft_info returns token_uri plus an extension. The extension carries name, description, and image for on-chain metadata. Off-chain JSON uses the same fields at the top level.

## How to fix

Set extension.image or token_uri, and a name.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/stargaze/metadata.md
