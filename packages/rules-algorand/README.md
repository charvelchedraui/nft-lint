# @nft-lint/rules-algorand

Algorand ARC-3, ARC-19, and ARC-69. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- ARC-3: JSON metadata URL, image, image_mimetype, image_integrity (SHA-256), and properties.
- ARC-19: template URLs with {id} substitution, similar in spirit to ERC-1155 but with Algorand asset ids.
- ARC-69: JSON metadata stored in the asset config note or a conventional off-chain document. Check standard, properties, and extra fields.
- Verify image_integrity against fetched bytes when the network is enabled.
- Add fixtures and docs/rules/algorand/.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/algorand/`. The registry test fails a PR that adds a rule without both.
