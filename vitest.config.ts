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
      "@nft-lint/fetchers": path.join(root, "packages/fetchers/src/index.ts"),
      "@nft-lint/preset": path.join(root, "packages/preset/src/index.ts"),
      "nft-lint": path.join(root, "packages/cli/src/index.ts"),
    },
  },
});
