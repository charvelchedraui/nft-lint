# @nft-lint/rules-stargaze

Stargaze cw721. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- Query cw721 token_info and contract_info via a public Stargaze LCD or RPC. No API key.
- token_uri should resolve to JSON with name or the collection's expected metadata fields, plus an image.
- Check royalty extension info when the contract exposes it.
- Add fixtures and docs/rules/stargaze/.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/stargaze/`. The registry test fails a PR that adds a rule without both.
