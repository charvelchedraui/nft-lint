# @nft-lint/rules-aptos

Aptos Digital Asset. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- Read the token object (Digital Asset / token v2) from a public Aptos fullnode.
- Check token name, uri, and the JSON document it points at (name, description, image).
- Check property map types when present.
- Add fixtures and docs/rules/aptos/.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/aptos/`. The registry test fails a PR that adds a rule without both.
