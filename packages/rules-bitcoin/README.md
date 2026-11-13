# @nft-lint/rules-bitcoin

Bitcoin Ordinals. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- Accept an inscription id or a metadata JSON document used by Ordinals collections.
- Validate the inscription content type and that the metadata JSON points at an inscription content URL the indexer can resolve.
- Check collection metadata fields used by common Ordinals explorers (name, description, image or inscription id).
- Keep all HTTP calls behind NetworkClient. Do not require a paid ordinals API.
- Add pass and fail fixtures and a docs page per rule.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/bitcoin/`. The registry test fails a PR that adds a rule without both.
