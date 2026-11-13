# aptos/token-fields

**Severity:** see the rule pack. **Network:** not required

## What it checks

Digital Asset name, description, and uri or image.

## Why it matters

The token object stores name, description, and uri on chain. uri is under 512 characters and description is under 2048. The JSON at uri should follow the ERC-1155 shape Aptos recommends, including image.

## How to fix

Set name and either uri or image.

Docs: https://github.com/charvelchedraui/nft-lint/blob/main/docs/rules/aptos/token-fields.md
