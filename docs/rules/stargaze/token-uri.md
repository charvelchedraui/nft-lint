# stargaze/token-uri

**Severity:** see the rule pack. **Network:** not required

## What it checks

cw721 token_uri and token_id.

## Why it matters

token_uri is the URL of the JSON document. token_id is a string. A JSON number drops leading zeros.

## How to fix

Point token_uri at ipfs:// or https://. Keep token_id a string.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/stargaze/token-uri.md
