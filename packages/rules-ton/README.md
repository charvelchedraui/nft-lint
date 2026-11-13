# @nft-lint/rules-ton

TON TEP-64. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- Read NFT item data (collection address, owner, content cell) from a public TON API or lite client. Prefer a documented public endpoint with no API key.
- Support off-chain content URIs and on-chain TEP-64 dictionaries.
- Require the metadata fields TEP-64 wallets expect: name, description, image, and optionally content_url / uri.
- Add fixtures for a valid item and for a missing image. Document the rule under docs/rules/ton/.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/ton/`. The registry test fails a PR that adds a rule without both.
