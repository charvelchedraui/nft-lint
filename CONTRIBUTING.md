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

The chain packs in `packages/rules-*` are part of the default preset. A new chain follows the same layout: `defineRule`, pass and fail fixtures, and a page under `docs/rules/`. Keep HTTP behind `NetworkClient` so CI stays offline. Do not add a paid API or a key.

Export the rules from `@nft-lint/preset` when they should run by default. Register the chain in `packages/core/src/chains.ts` so the CLI and the web picker can select it.

## Pull requests

Use the PR template. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`. Do not commit secrets, RPC keys, or wallet keys. Public RPC URLs in the chain registry are fine.

Changesets are configured (`.changeset/`) for a later npm publish. Publishing is not wired to CI yet.
