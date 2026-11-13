# algorand/arc19-template

**Severity:** see the rule pack. **Network:** not required

## What it checks

ARC-19 template-ipfs URLs.

## Why it matters

The placeholder is {ipfscid:version:codec:reserve:sha2-256}. version is 0 or 1. The 32-byte digest lives in the reserve address, so the metadata can change later. {ID} is not a valid placeholder.

## How to fix

Use {ipfscid:1:raw:reserve:sha2-256} or {ipfscid:0:dag-pb:reserve:sha2-256}.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/algorand/arc19-template.md
