# Good first issues

Eighteen issues ready to file on [charvelchedraui/nft-lint](https://github.com/charvelchedraui/nft-lint/issues). Suggested labels are on each title. v1 already covers background color, date timestamps, hardcoded IPFS gateways, `http` vs `https`, YouTube URLs, duplicate traits, Metaplex symbol length, and `image` inside `properties.files`. The work below is what is still open.

File them as written. Do not add a private key, an RPC secret, or a production wallet to the issue.

---

### 1. Tezos TZIP-21 rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-tezos` is an empty pack. Implement TZIP-21 checks: `name`, `artifactUri`, `displayUri`, `thumbnailUri`, `decimals` (0 for a 1/1), `creators`, `formats[]` (`uri`, `mimeType`), `royalties`, and attributes as `{name, value}`. Read tokens from a public TzKT endpoint behind `NetworkClient`. Add pass and fail fixtures and `docs/rules/tezos/`.

### 2. Bitcoin Ordinals metadata rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-bitcoin` is a stub. Validate inscription or collection metadata JSON: content type, and the name, description, and image or inscription id explorers expect. No paid ordinals API. Fixtures and docs required.

### 3. TON TEP-64 rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-ton` is a stub. Support off-chain content URIs and, if you can do it with a public API, on-chain TEP-64 content. Check name, description, and image. Document the endpoint you used.

### 4. Flow MetadataViews rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-flow` is a stub. Read Cadence `Display`, media file views, and royalties from a public Flow access node. Flow EVM can wait; EVM-shaped JSON can reuse `@nft-lint/rules-evm` later.

### 5. Tron TRC-721 rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-tron` is a stub. TRC-721 is close to ERC-721. Add a chain entry (full-node URL, explorer) and a `tokenURI` reader. Reuse the EVM JSON rules instead of copying them. Cover one valid URI and one that returns HTML.

### 6. Cardano CIP-25 and CIP-68 rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-cardano` is a stub. CIP-25 is the `721` metadata label (`name`, `image`, `mediaType`, `files`). CIP-68 is datum metadata. Accept a JSON file first so tests stay offline. A public preview API is optional and must be behind `needsNetwork`.

### 7. Algorand ARC-3, ARC-19, and ARC-69 rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-algorand` is a stub. ARC-3: JSON URL, `image`, `image_mimetype`, `image_integrity`. ARC-19: `{id}` templates. ARC-69: the conventional JSON document. Verify `image_integrity` only when the network is on.

### 8. Sui Display rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-sui` is a stub. Read a Display object from a public fullnode. Check name, description, and image URL, and warn when a template such as `{name}` was left unsubstituted.

### 9. Aptos Digital Asset rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-aptos` is a stub. Read a Digital Asset from a public fullnode. Check name, uri, and the JSON it points at. Check the property map when it is present.

### 10. Stargaze cw721 rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

`packages/rules-stargaze` is a stub. Query `token_info` from a public LCD. `token_uri` should resolve to JSON with an image. Check a royalty extension when the contract exposes one.

### 11. Translate rule docs to Spanish

Labels: `good first issue`, `help wanted`, `documentation`

Add `docs/rules/es/` with a translation of each page in `docs/rules/`. Keep the rule id in English. Do not translate the machine-readable finding messages in the same pull request; those are asserted by fixtures.

### 12. CORS proxy for the web page

Labels: `good first issue`, `help wanted`

`packages/web` fetches URIs from the browser, so some hosts fail CORS. Add an optional proxy (a Cloudflare Worker is a good fit) with a rate limit, no API key, and a documented allowlist of gateways. The page must still work with the proxy turned off.

### 13. npm publish workflow with provenance

Labels: `good first issue`, `help wanted`

`.changeset/` is configured and packages are `publishConfig.access: public`. Add a workflow that publishes changed packages to npm with provenance when a maintainer tags a release. Do not add an npm token to the repository.

### 14. Fetch ERC-1155 localization files

Labels: `good first issue`

`evm/erc1155-localization` checks the object shape only. When `needsNetwork` is allowed, substitute `{locale}` for the default locale, fetch that JSON, and warn if it is missing `name` or `image`.

### 15. One nightly sample per v1 chain

Labels: `good first issue`, `help wanted`

`.github/workflows/nightly.yml` runs `pnpm test:network` against `https://example.com`. Extend the opt-in test with one public token per launch chain (metadata URL or `chain:contract:tokenId`). Keep the job `continue-on-error`. Do not embed an API key. Skip a chain when its public RPC is down and say which one.

### 16. Suggest a canonical type for mixed traits

Labels: `good first issue`

`common/trait-type-consistency` warns when a folder mixes string and number for one trait. Also say which type is more common (`12 files use string, 1 uses number`) so the author knows what to change.

### 17. Record RPC fixtures for the EVM reader

Labels: `good first issue`

`readEvmNft` is unit-tested with a fake reader. Add a recorded `eth_call` transcript (no live network) for `supportsInterface`, `tokenURI`, and `royaltyInfo`, and play it back through `createViemReader` or a thin HTTP mock. The default `pnpm test` must stay offline.

### 18. Hedera HIP-412 rule pack

Labels: `good first issue`, `help wanted`, `rule-pack`

HIP-412 is not stubbed yet. Add `packages/rules-hedera` on the same pattern as the other stubs, then implement the HIP-412 JSON checks (`name`, `description`, `image`, `type`, `properties`). Follow `CONTRIBUTING.md` for fixtures and docs.
