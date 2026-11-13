import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.resolve(import.meta.dirname, "..");

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "quiet-favicon",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === "/favicon.ico") {
            res.statusCode = 204;
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@nft-lint/core": path.join(root, "core/src/index.ts"),
      "@nft-lint/preset": path.join(root, "preset/src/index.ts"),
      "@nft-lint/rules-evm": path.join(root, "rules-evm/src/index.ts"),
      "@nft-lint/rules-solana": path.join(root, "rules-solana/src/index.ts"),
      "@nft-lint/rules-media": path.join(root, "rules-media/src/index.ts"),
      "@nft-lint/rules-tezos": path.join(root, "rules-tezos/src/index.ts"),
      "@nft-lint/rules-bitcoin": path.join(root, "rules-bitcoin/src/index.ts"),
      "@nft-lint/rules-ton": path.join(root, "rules-ton/src/index.ts"),
      "@nft-lint/rules-flow": path.join(root, "rules-flow/src/index.ts"),
      "@nft-lint/rules-tron": path.join(root, "rules-tron/src/index.ts"),
      "@nft-lint/rules-cardano": path.join(root, "rules-cardano/src/index.ts"),
      "@nft-lint/rules-algorand": path.join(root, "rules-algorand/src/index.ts"),
      "@nft-lint/rules-sui": path.join(root, "rules-sui/src/index.ts"),
      "@nft-lint/rules-aptos": path.join(root, "rules-aptos/src/index.ts"),
      "@nft-lint/rules-stargaze": path.join(root, "rules-stargaze/src/index.ts"),
    },
  },
  server: { host: "0.0.0.0", port: 43123, strictPort: true },
  preview: { host: "0.0.0.0", port: 43123, strictPort: true },
});
