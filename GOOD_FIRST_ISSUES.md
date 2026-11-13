# Good first issues

Eight issues ready to file on [charvelchedraui/nft-lint](https://github.com/charvelchedraui/nft-lint/issues). Suggested labels are on each title. The chain packs for Tezos, Bitcoin Ordinals, TON, Flow, Tron, Cardano, Algorand, Sui, Aptos, and Stargaze are implemented. The work below is what is still open.

File them as written. Do not add a private key, an RPC secret, or a production wallet to the issue.

---

### 1. Translate rule docs to Spanish

Labels: `good first issue`, `help wanted`, `documentation`

Add `docs/rules/es/` with a translation of each page in `docs/rules/`. Keep the rule id in English. Do not translate the machine-readable finding messages in the same pull request; those are asserted by fixtures.

### 2. CORS proxy for the web page

Labels: `good first issue`, `help wanted`

`packages/web` fetches URIs from the browser, so some hosts fail CORS. Add an optional proxy (a Cloudflare Worker is a good fit) with a rate limit, no API key, and a documented allowlist of gateways. The page must still work with the proxy turned off.

### 3. npm publish workflow with provenance

Labels: `good first issue`, `help wanted`

`.changeset/` is configured and packages are `publishConfig.access: public`. Add a workflow that publishes changed packages to npm with provenance when a maintainer tags a release. Do not add an npm token to the repository.

### 4. Fetch ERC-1155 localization files

Labels: `good first issue`

`evm/erc1155-localization` checks the object shape only. When `needsNetwork` is allowed, substitute `{locale}` for the default locale, fetch that JSON, and warn if it is missing `name` or `image`.

### 5. One nightly sample per chain

Labels: `good first issue`, `help wanted`

`.github/workflows/nightly.yml` runs `pnpm test:network` against `https://example.com`. Extend the opt-in test with one public token per supported chain (metadata URL or `chain:contract:tokenId`). Keep the job `continue-on-error`. Do not embed an API key. Skip a chain when its public RPC is down and say which one.

### 6. Suggest a canonical type for mixed traits

Labels: `good first issue`

`common/trait-type-consistency` warns when a folder mixes string and number for one trait. Also say which type is more common (`12 files use string, 1 uses number`) so the author knows what to change.

### 7. Record RPC fixtures for the EVM reader

Labels: `good first issue`

`readEvmNft` is unit-tested with a fake reader. Add a recorded `eth_call` transcript (no live network) for `supportsInterface`, `tokenURI`, and `royaltyInfo`, and play it back through `createViemReader` or a thin HTTP mock. The default `pnpm test` must stay offline.

### 8. Hedera HIP-412 rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

HIP-412 is not packaged yet. Add `packages/rules-hedera` on the same pattern as the other packs, then implement the HIP-412 JSON checks (`name`, `description`, `image`, `type`, `properties`). Follow `CONTRIBUTING.md` for fixtures and docs.
