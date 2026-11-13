# media/ipfs-uri

**Severity:** see the rule pack. **Network:** not required

## What it checks

IPFS URIs.

## Why it matters

A hardcoded gateway dies when that gateway dies. An invalid CID never resolves.

## How to fix

Use ipfs://<cid>/<path>. Do not prefix https://ipfs.io/ipfs/ or https://gateway.pinata.cloud/ipfs/.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/media/ipfs-uri.md
