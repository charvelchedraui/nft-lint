# algorand/arc3-integrity

**Severity:** see the rule pack. **Network:** not required

## What it checks

W3C sha256- integrity for image, animation_url, and external_url.

## Why it matters

The value is sha256- plus base64 of the raw 32-byte digest, not hex. When the network is on, the fetched bytes are hashed and compared. The comparison is skipped offline and for external_url, which may be a mutable page.

## How to fix

Recompute the digest from the file bytes. ARC-19 assets should not rely on the ASA metadata hash.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/algorand/arc3-integrity.md
