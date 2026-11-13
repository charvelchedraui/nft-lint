# @nft-lint/rules-cardano

Cardano CIP-25 and CIP-68. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- CIP-25: metadata lives under the 721 label in the transaction metadata. Check name, image, mediaType, and files[].
- CIP-68: datum metadata (name, image, mediaType, description) referenced by the asset.
- Accept either a metadata JSON file or a policy id plus asset name. Use a public preview API only behind an opt-in network flag.
- Add fixtures for both standards and docs/rules/cardano/.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/cardano/`. The registry test fails a PR that adds a rule without both.
