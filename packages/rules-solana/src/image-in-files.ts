import { defineRule, isRecord, ruleDocUrl } from "@nft-lint/core";

export const imageInFilesRule = defineRule({
  id: "solana/image-in-files",
  chains: ["solana"],
  standards: ["metaplex-token-metadata", "metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("solana/image-in-files"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || typeof ctx.json.image !== "string" || ctx.json.image.trim() === "") return;
    if (!isRecord(ctx.json.properties) || !Array.isArray(ctx.json.properties.files)) return;
    const image = ctx.json.image;
    const match = ctx.json.properties.files.find((file) => isRecord(file) && file.uri === image);
    if (!match || !isRecord(match)) {
      ctx.report({
        path: "properties.files",
        message:
          "image must also appear as a properties.files entry so wallets know its MIME type.",
      });
      return;
    }
    if (typeof match.type === "string" && !match.type.startsWith("image/")) {
      ctx.report({
        path: "properties.files",
        severity: "warn",
        message: `The file entry for image declares type "${match.type}", which is not an image MIME type.`,
      });
    }
  },
});
