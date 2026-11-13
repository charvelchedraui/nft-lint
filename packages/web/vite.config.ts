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
    },
  },
  server: { host: "0.0.0.0", port: 43123, strictPort: true },
  preview: { host: "0.0.0.0", port: 43123, strictPort: true },
});
