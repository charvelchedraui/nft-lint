# evm/token-uri

**Severity:** see the rule pack. **Network:** not required

## What it checks

tokenURI or uri returned by the contract.

## Why it matters

A token with no URI has nothing for a marketplace to fetch.

## How to fix

ERC-721 must return tokenURI. ERC-1155 must return uri. The string may contain {id}.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/evm/token-uri.md
