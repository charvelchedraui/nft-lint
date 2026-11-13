# Contributing

NFT Lint is a rule runner plus one package per chain. A new chain should not require edits to the runner.

## Setup

```bash
pnpm install
pnpm test
```

Node 20+ and pnpm 10. Tests are offline unless you set `NFT_LINT_NETWORK=1`.

## A rule

```ts
import { defineRule, ruleDocUrl } from "@nft-lint/core";

export default defineRule({
  id: "tezos/tzip21-formats",
  chains: ["tezos"],
  standards: ["tzip-21"],
  severity: "error",
  docs: ruleDocUrl("tezos/tzip21-formats"),
  needsNetwork: false,
  check(ctx) {
    // ctx.report({ path, message, severity? })
  },
});
```

- Id prefix is the chain family or `common` / `media`, then kebab-case.
- `needsNetwork: true` only when the check fetches. The CLI skips those rules with `--offline`.
- At least one pass fixture and one fail fixture in `fixtures/`.
- A page at `docs/rules/<id>.md` with what it checks, why, and how to fix it.
- Messages are specific. Name the field and the expected shape.

`pnpm rules:check` runs the registry test that enforces the doc and the fixtures for every rule in the default pack.

## A chain

Stub packages already exist for Tezos, Bitcoin Ordinals, TON, Flow, Tron, Cardano, Algorand, Sui, Aptos, and Stargaze. Each `README` lists the checks to write. Keep HTTP behind `NetworkClient` so CI stays offline. Do not add a paid API or a key.

When the pack is useful, export its rules from `@nft-lint/preset` only if they should run by default. Until then, document how to pass `rules: [...defaultRules, ...yourRules]`.

## Pull requests

Use the PR template. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Do not commit secrets, RPC keys, or wallet keys. Public RPC URLs in the chain registry are fine.

Changesets are configured (`.changeset/`) for a later npm publish. Publishing is not wired to CI yet.
