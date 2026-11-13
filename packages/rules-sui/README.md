# @nft-lint/rules-sui

Sui Display. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- Read the Display object for a Sui NFT type from a public fullnode. No API key.
- Check the required Display fields (name, description, image_url or the project's equivalent) and that template variables such as {name} were substituted.
- Compare on-chain Display fields with off-chain JSON when a metadata URL is present.
- Add fixtures and docs/rules/sui/.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/sui/`. The registry test fails a PR that adds a rule without both.
