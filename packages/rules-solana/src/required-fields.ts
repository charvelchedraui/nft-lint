import {
  defineRule,
  isRecord,
  metaplexMetadataSchema,
  ruleDocUrl,
  schemaIssues,
} from "@nft-lint/core";

const CATEGORIES = new Set(["image", "video", "audio", "vr", "html"]);

export const solanaRequiredRule = defineRule({
  id: "solana/required-fields",
  chains: ["solana"],
  standards: ["metaplex-token-metadata", "metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("solana/required-fields"),
  needsNetwork: false,
  check(ctx) {
    if (!isRecord(ctx.value)) return;
    for (const issue of schemaIssues(metaplexMetadataSchema, ctx.value)) {
      ctx.report({ path: issue.path, message: issue.message });
    }
    if (ctx.value.description === "") {
      ctx.report({
        path: "description",
        severity: "warn",
        message: "description is empty. Wallets will show a blank token.",
      });
    }
    const properties = isRecord(ctx.value.properties) ? ctx.value.properties : null;
    if (!properties || !Array.isArray(properties.files)) return;
    properties.files.forEach((file, index) => {
      if (!isRecord(file) || typeof file.uri !== "string" || file.uri.trim() === "") {
        ctx.report({
          path: `properties.files[${index}].uri`,
          message: "Each properties.files entry needs a uri string.",
        });
      }
      if (!isRecord(file) || typeof file.type !== "string" || file.type.trim() === "") {
        ctx.report({
          path: `properties.files[${index}].type`,
          message: "Each properties.files entry needs a type string (a MIME type).",
        });
      }
    });
    if (typeof properties.category === "string" && !CATEGORIES.has(properties.category)) {
      ctx.report({
        path: "properties.category",
        severity: "warn",
        message: `properties.category "${properties.category}" is not one of image, video, audio, vr, html.`,
      });
    }
  },
});
