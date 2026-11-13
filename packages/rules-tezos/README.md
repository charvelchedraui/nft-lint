# @nft-lint/rules-tezos

Tezos TZIP-21 and TZIP-16. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- Read token metadata from TzKT (or Taquito) using the contract address and token id. Keep the HTTP client behind the shared NetworkClient so tests stay offline.
- Require name, artifactUri, displayUri, thumbnailUri, decimals (0 for a 1/1 NFT), and creators.
- Check formats[] entries for uri and mimeType. When fileSize or dimensions are present and the network is available, compare them to the fetched bytes.
- Check royalties.decimals and royalties.shares. Shares should be a sane fraction of the decimals scale.
- Check attributes as {name, value} (TZIP-21), not OpenSea trait_type.
- Type-check tags, rights, and isBooleanAmount when they are present.
- Add fixtures under fixtures/tezos/<rule-id>/ and a page under docs/rules/tezos/.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/tezos/`. The registry test fails a PR that adds a rule without both.
