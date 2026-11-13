import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 20_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["packages/*/src/**/*.ts"],
      exclude: ["packages/web/**", "packages/rules-*/src/index.ts"],
    },
  },
  resolve: {
    alias: {
      "@nft-lint/core": path.join(root, "packages/core/src/index.ts"),
      "@nft-lint/rules-evm": path.join(root, "packages/rules-evm/src/index.ts"),
      "@nft-lint/rules-solana": path.join(root, "packages/rules-solana/src/index.ts"),
      "@nft-lint/rules-media": path.join(root, "packages/rules-media/src/index.ts"),
      "@nft-lint/rules-tezos": path.join(root, "packages/rules-tezos/src/index.ts"),
      "@nft-lint/rules-bitcoin": path.join(root, "packages/rules-bitcoin/src/index.ts"),
      "@nft-lint/rules-ton": path.join(root, "packages/rules-ton/src/index.ts"),
      "@nft-lint/rules-flow": path.join(root, "packages/rules-flow/src/index.ts"),
      "@nft-lint/rules-tron": path.join(root, "packages/rules-tron/src/index.ts"),
      "@nft-lint/rules-cardano": path.join(root, "packages/rules-cardano/src/index.ts"),
      "@nft-lint/rules-algorand": path.join(root, "packages/rules-algorand/src/index.ts"),
      "@nft-lint/rules-sui": path.join(root, "packages/rules-sui/src/index.ts"),
      "@nft-lint/rules-aptos": path.join(root, "packages/rules-aptos/src/index.ts"),
      "@nft-lint/rules-stargaze": path.join(root, "packages/rules-stargaze/src/index.ts"),
      "@nft-lint/fetchers": path.join(root, "packages/fetchers/src/index.ts"),
      "@nft-lint/preset": path.join(root, "packages/preset/src/index.ts"),
      "nft-lint": path.join(root, "packages/cli/src/index.ts"),
    },
  },
});
