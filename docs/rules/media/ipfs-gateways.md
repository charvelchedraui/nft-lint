# media/ipfs-gateways

**Severity:** see the rule pack. **Network:** required

## What it checks

IPFS gateway reachability.

## Why it matters

A CID that is not pinned loads on zero public gateways and the token image breaks.

## How to fix

Pin the CID. nft-lint tries the gateways in nft-lint.config.json and reports which ones answered.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/media/ipfs-gateways.md
