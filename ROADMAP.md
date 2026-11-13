# Roadmap

## v1 (this tree)

Shipped:

- Rule runner, config, SARIF, JSON, and text reports
- Nine EVM chains on one ERC-721 / ERC-1155 pack, plus Solana Metaplex Token Metadata and Core
- Shared media checks: IPFS, Arweave, MIME, size, reachability, host policy
- CLI (`nft-lint`), library packages, browser page, fixtures, and CI

Not in v1, on purpose:

- Whole-collection rarity stats
- Rewriting or pinning metadata
- A hosted CORS proxy (the page fetches from the browser)
- npm publish automation

## Next rule packs

These packages exist and export zero rules. Each README is the issue brief.

| Package                    | Standard              | Status |
| -------------------------- | --------------------- | ------ |
| `@nft-lint/rules-tezos`    | TZIP-21, TZIP-16      | stub   |
| `@nft-lint/rules-bitcoin`  | Ordinals metadata     | stub   |
| `@nft-lint/rules-ton`      | TEP-64                | stub   |
| `@nft-lint/rules-flow`     | Cadence MetadataViews | stub   |
| `@nft-lint/rules-tron`     | TRC-721               | stub   |
| `@nft-lint/rules-cardano`  | CIP-25, CIP-68        | stub   |
| `@nft-lint/rules-algorand` | ARC-3, ARC-19, ARC-69 | stub   |
| `@nft-lint/rules-sui`      | Display               | stub   |
| `@nft-lint/rules-aptos`    | Digital Asset         | stub   |
| `@nft-lint/rules-stargaze` | cw721                 | stub   |

Hedera HIP-412 is not stubbed. It can follow the same package layout when someone wants it.

## After the packs

- Changesets publish workflow with npm provenance
- A small CORS proxy for the web page, with a rate limit
- ERC-1155 `localization.uri` fetch, not only shape checks
- More real public tokens in the nightly sample list
