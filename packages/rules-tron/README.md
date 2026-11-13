# @nft-lint/rules-tron

Tron TRC-721. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- TRC-721 is close to ERC-721. Add a Tron chain entry (chain id, public full-node URL, explorer) and a reader that calls tokenURI.
- Reuse the EVM JSON rules where the metadata shape matches, and add Tron-specific differences instead of copying every check.
- Cover a valid tokenURI and a tokenURI that returns HTML. Add docs/rules/tron/.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/tron/`. The registry test fails a PR that adds a rule without both.
