# media/arweave-uri

**Severity:** see the rule pack. **Network:** not required

## What it checks

Arweave URIs.

## Why it matters

ar:// and https://arweave.net/<txid> must use a 43-character base64url transaction id.

## How to fix

Use ar:// followed by the transaction id.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/media/arweave-uri.md
