# Rules

Each file is one rule. The path matches the rule id: `evm/required-fields` is [evm/required-fields.md](evm/required-fields.md).

v1 groups:

- [common](common/json.md) — JSON, standard detection, remote fetch, folder trait types
- [evm](evm/required-fields.md) — ERC-721, ERC-1155, contractURI, EIP-2981
- [solana](solana/required-fields.md) — Metaplex Token Metadata and Core
- [media](media/ipfs-uri.md) — IPFS, Arweave, MIME, size, reachability

Stub chains do not have rule pages yet. Their TODOs are in `packages/rules-* /README.md`.
