# NFT Lint

A free, open-source linter for NFT metadata. Point it at a JSON file, a metadata URI, or `chain:contract:tokenId` and it reports what is missing, malformed, or likely to break in a marketplace.

[![CI](https://github.com/charvelchedraui/nft-lint/actions/workflows/ci.yml/badge.svg)](https://github.com/charvelchedraui/nft-lint/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/charvelchedraui/nft-lint)](https://github.com/charvelchedraui/nft-lint/blob/main/LICENSE)

Multichain is the point. Nine EVM networks share one ERC-721 / ERC-1155 engine. Solana uses Metaplex Token Metadata and Core. Tezos, Bitcoin Ordinals, TON, Flow, Tron, Cardano, Algorand, Sui, Aptos, and Stargaze each have their own pack.

## Quick start

```bash
pnpm install
pnpm --filter nft-lint build
pnpm exec nft-lint path/to/metadata.json --offline
pnpm exec nft-lint ipfs://bafy.../1.json
pnpm exec nft-lint base:0xContract:1
pnpm exec nft-lint chains
```

The browser page lives in `packages/web`:

```bash
pnpm dev:web
```

Open the printed local URL. Paste JSON, or a metadata URI. Chain reads stay in the CLI, where you can set an RPC.

Exit codes: `0` no errors, `1` errors (or warnings with `--strict`), `2` bad usage.

## Why

Marketplaces each validate differently and rarely say why a token looks wrong. Typical breaks:

- an image URL pinned to one IPFS gateway
- ERC-1155 `{id}` written as `{ID}`
- OpenSea `display_type: date` stored as milliseconds
- a creator who believes royalties are set, while `supportsInterface(0x2a55205a)` is false
- Metaplex JSON with an empty `properties.files` array, or a `symbol` longer than 10 bytes

NFT Lint is a library, a CLI, and a small web page over one rule runner. It is meant to run in CI. It does not rewrite metadata, pin files, or call a paid API.

## Chains

| Chain             | CAIP-2 / id               | Standards                                                 | Status |
| ----------------- | ------------------------- | --------------------------------------------------------- | ------ |
| Ethereum          | `eip155:1`                | ERC-721, ERC-1155, OpenSea attributes, EIP-2981, ERC-7572 | stable |
| Base              | `eip155:8453`             | same EVM pack                                             | stable |
| Arbitrum          | `eip155:42161`            | same EVM pack                                             | stable |
| OP Mainnet        | `eip155:10`               | same EVM pack                                             | stable |
| BNB Chain         | `eip155:56`               | same EVM pack                                             | stable |
| Avalanche C-Chain | `eip155:43114`            | same EVM pack                                             | stable |
| Robinhood Chain   | `eip155:4663`             | same EVM pack                                             | stable |
| Polygon PoS       | `eip155:137`              | same EVM pack                                             | stable |
| ApeChain          | `eip155:33139`            | same EVM pack                                             | stable |
| Solana            | mainnet-beta genesis hash | Metaplex Token Metadata, Metaplex Core                    | stable |
| Tezos             | `tezos:NetXdQprcVkpaWU`   | TZIP-12, TZIP-16, TZIP-21                                 | stable |
| Bitcoin Ordinals  | `bip122` genesis hash     | inscription and collection metadata                       | stable |
| TON               | `ton:-239`                | TEP-62, TEP-64                                            | stable |
| Flow              | `flow:mainnet`            | MetadataViews                                             | stable |
| Tron              | `tron:mainnet`            | TRC-721                                                   | stable |
| Cardano           | `cardano:mainnet`         | CIP-25, CIP-68, CIP-27                                    | stable |
| Algorand          | mainnet genesis hash      | ARC-3, ARC-19, ARC-69                                     | stable |
| Sui               | `sui:mainnet`             | Display, Kiosk                                            | stable |
| Aptos             | `aptos:1`                 | Digital Asset                                             | stable |
| Stargaze          | `cosmos:stargaze-1`       | cw721, sg721                                              | stable |

Solana has no EIP-155 chain id. The registry stores the mainnet-beta genesis hash `5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d`.

Each chain entry has a chain id, one or more default public RPC URLs, and an explorer URL. Public RPCs are rate limited. Override them:

```bash
nft-lint base:0xContract:1 --rpc base=https://your.rpc
```

or `NFT_LINT_RPC_BASE`, `NFT_LINT_RPC_SOLANA`, and the same pattern for every chain id. Robinhood Chain's public RPC is documented by Robinhood as rate limited.

## Library

```typescript
import { lint } from "@nft-lint/preset";

const report = await lint(metadataJson, { offline: true });
if (report.summary.errors > 0) process.exit(1);
```

`@nft-lint/core` is the engine (`defineRule`, `lint` with an explicit rule list). `@nft-lint/preset` is the v1 rule set: builtins, EVM, Solana, and media. `@nft-lint/fetchers` reads `tokenURI` / `uri` / EIP-2981 with viem, Metaplex Token Metadata and Core with Umi, and the other chains through public indexers and full nodes (TzKT, ordinals.com, tonapi, a Flow access node, TronGrid, Koios, Algonode, a Sui fullnode, Aptos fullnode, and the Stargaze LCD).

Packages:

| Package       | Name                                                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Engine        | `@nft-lint/core`                                                                                                                                                   |
| Preset        | `@nft-lint/preset`                                                                                                                                                 |
| EVM rules     | `@nft-lint/rules-evm`                                                                                                                                              |
| Solana rules  | `@nft-lint/rules-solana`                                                                                                                                           |
| Media rules   | `@nft-lint/rules-media`                                                                                                                                            |
| Chain readers | `@nft-lint/fetchers`                                                                                                                                               |
| CLI           | `nft-lint`                                                                                                                                                         |
| More chains   | `@nft-lint/rules-tezos`, `rules-bitcoin`, `rules-ton`, `rules-flow`, `rules-tron`, `rules-cardano`, `rules-algorand`, `rules-sui`, `rules-aptos`, `rules-stargaze` |

JSON Schema documents for other languages are in [`schemas/`](schemas/).

## CLI

```text
nft-lint <file|directory|url|chain:contract:tokenId> [options]

--offline                 Skip rules that fetch
--json                    JSON report
--sarif                   SARIF 2.1.0
--quiet                   Errors only
--strict                  Exit 1 on warnings
--config <file>           nft-lint.config.json
--rpc <chain=url>         Repeatable
--timeout <ms>
--max-image-bytes <n>
--royalty-warn-above <percent>
--chain <id>              Lint a file as this chain (tezos, bitcoin, ton, flow, tron, cardano, algorand, sui, aptos, stargaze, or an EVM alias)
nft-lint chains
nft-lint rules
```

A directory of JSON files is linted one file at a time. If the same `trait_type` is a string in one file and a number in another, `common/trait-type-consistency` warns.

Chain aliases include `eth`, `base`, `arb`, `op`, `bnb` / `bsc`, `avax`, `robinhood`, `polygon` / `matic`, `ape`, `sol`, `xtz`, `btc` / `ordinals`, `ton`, `flow`, `trx`, `ada`, `algo`, `sui`, `apt`, and `stars`.

Targets look like `tezos:KT1...:1`, `tron:T...:1`, `cardano:<policy>:<asset>`, `flow:0x...:1`, or `stargaze:<contract>:<token_id>`. Bitcoin, TON, Algorand, Sui, and Aptos take a single id: `bitcoin:<inscription_id>`, `ton:<address>`, `algorand:<asset_id>`, `sui:<object_id>`, `aptos:<object>`.

## CI

Once `nft-lint` is on npm:

```yaml
- uses: charvelchedraui/nft-lint/packages/action@v1
  with:
    target: metadata/
    offline: "true"
```

The action runs `npx nft-lint`. It does nothing useful until the package is published. Until then, call the local binary:

```bash
node packages/cli/dist/cli.js metadata/ --offline --sarif
```

Default tests do not touch the network. `pnpm test:network` (and the nightly workflow) opts in.

## Rules

Every rule has a page under [`docs/rules/`](docs/rules/). The id is the path: `evm/erc1155-id` is `docs/rules/evm/erc1155-id.md`.

Shared checks in v1:

- JSON object, UTF-8, duplicate keys
- ERC-721 / ERC-1155 required `name`, `description`, `image`
- ERC-1155 `{id}` substitution, `decimals`, `localization`
- OpenSea attributes, `background_color`, `external_url`, `animation_url`, `youtube_url`
- `contractURI` shape and EIP-2981 (`supportsInterface`, zero receiver, fee above 10%, mismatch with contract metadata)
- Metaplex required fields, `image` listed in `properties.files`, on-chain byte lengths, creator shares, Core name/uri, on-chain vs JSON attributes
- TZIP-21 URIs, formats, objkt royalties, and TZIP-16 views
- Ordinals inscription ids, content types, collection metadata, and size
- TEP-64 content, TEP-62 royalty params
- Flow MetadataViews (Display, royalties, editions, traits, collection display)
- TRC-721 tokenURI, base58 addresses, and HTML responses (ERC-721 field checks are reused)
- CIP-25 / CIP-68 metadata and CIP-27 royalties
- ARC-3, ARC-19 templates, ARC-69, and ASA byte limits
- Sui Display templates and Kiosk owners
- Aptos Digital Asset uri, property map, and royalty
- Stargaze sg721 extension, token_uri, and royalty share
- IPFS CID and `ipfs://` form, gateway probes, Arweave ids, `http` / localhost / centralized hosts, reachability, sniffed MIME, size

`needsNetwork` rules are skipped with `--offline`. The report lists them in `skippedRules`.

## Config

Copy [`nft-lint.config.example.json`](nft-lint.config.example.json) to `nft-lint.config.json`. The CLI walks up from the working directory. Precedence is CLI flag, then environment, then the file, then the built-in default.

```json
{
  "royaltyWarnAbovePercent": 10,
  "maxImageBytes": 10485760,
  "ipfsGateways": ["https://ipfs.io/ipfs/"],
  "rules": { "media/host-policy": { "severity": "info" } }
}
```

## Add a rule

1. Export a rule from `defineRule` in `@nft-lint/core`. Ids look like `tezos/formats`.
2. Add `fixtures/<rule-id>-pass.json` and `fixtures/<rule-id>-fail.json`.
3. Add `docs/rules/<rule-id>.md`.
4. `pnpm test` fails the registry check when a default rule has no doc or no fixture.

See [CONTRIBUTING.md](CONTRIBUTING.md), [ROADMAP.md](ROADMAP.md), and [GOOD_FIRST_ISSUES.md](GOOD_FIRST_ISSUES.md).

## Develop

Node 20 or newer. pnpm 10.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:network   # optional, hits the public network
```

## License and credits

[Apache-2.0](LICENSE). Copyright 2026 charvelchedraui.

The checks follow public standards: EIP-721, EIP-1155, EIP-2981, ERC-7572, the OpenSea metadata notes, Metaplex Token Metadata and Core, TZIP-12, TZIP-16, TZIP-21, TEP-62, TEP-64, Flow MetadataViews, TRC-721, CIP-25, CIP-27, CIP-68, ARC-3, ARC-19, ARC-69, Sui Display, the Aptos Digital Asset standard, and cw721 / sg721. Ordinals collection metadata follows the JSON marketplaces index. Those documents remain under their own licenses. This project does not claim them.
