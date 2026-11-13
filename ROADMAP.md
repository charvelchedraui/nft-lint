# Roadmap

## v1 (this tree)

Shipped:

- Rule runner, config, SARIF, JSON, and text reports
- Nine EVM chains on one ERC-721 / ERC-1155 pack, plus Solana Metaplex Token Metadata and Core
- Tezos, Bitcoin Ordinals, TON, Flow, Tron, Cardano, Algorand, Sui, Aptos, and Stargaze rule packs
- Shared media checks: IPFS, Arweave, MIME, size, reachability, host policy
- CLI (`nft-lint`), library packages, browser page, fixtures, and CI

Not in v1, on purpose:

- Whole-collection rarity stats
- Rewriting or pinning metadata
- A hosted CORS proxy (the page fetches from the browser)
- npm publish automation

## Chain packs

All twenty chains ship a rule pack. Hedera HIP-412 is not packaged. It can follow the same layout when someone wants it.

## After the packs

- Changesets publish workflow with npm provenance
- A small CORS proxy for the web page, with a rate limit
- ERC-1155 `localization.uri` fetch, not only shape checks
- More real public tokens in the nightly sample list
