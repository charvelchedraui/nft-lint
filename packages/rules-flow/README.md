# @nft-lint/rules-flow

Flow MetadataViews. **Status: stub.**

This package is a placeholder so the rule-pack layout is real and a contributor can land the checks without inventing the package.

## TODO

- Read Cadence MetadataViews (Display, HTTPFile, IPFSFile, Royalties, Traits) from a public Flow access node.
- Also note Flow EVM as a later follow-up: EVM-shaped metadata can reuse @nft-lint/rules-evm once a Flow EVM chain entry exists.
- Check Display.name, Display.description, and a media file view. Check royalty receivers.
- Add fixtures and docs/rules/flow/.

Wire finished rules into `src/index.ts` as a `Rule[]`, add pass and fail fixtures, and add a page under `docs/rules/flow/`. The registry test fails a PR that adds a rule without both.
