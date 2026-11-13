# cardano/cip25-chunks

**Severity:** see the rule pack. **Network:** not required

## What it checks

64-byte metadata string chunks and the joined image URI.

## Why it matters

Transaction metadata strings cannot exceed 64 bytes. Longer URIs are arrays that viewers concatenate. The joined value must be ipfs://, ar://, https://, or data:. A bare CID is not enough.

## How to fix

Split the URI into chunks of at most 64 bytes and keep the scheme on the front.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/cardano/cip25-chunks.md
