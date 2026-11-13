import { defineRule, isRecord, ruleDocUrl } from "@nft-lint/core";

export const erc1155LocalizationRule = defineRule({
  id: "evm/erc1155-localization",
  chains: ["evm"],
  standards: ["erc-1155"],
  severity: "error",
  docs: ruleDocUrl("evm/erc1155-localization"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("localization" in ctx.json)) return;
    const localization = ctx.json.localization;
    if (!isRecord(localization)) {
      ctx.report({
        path: "localization",
        message: "localization must be an object with uri, default, and locales.",
      });
      return;
    }
    if (typeof localization.uri !== "string" || !localization.uri.includes("{locale}")) {
      ctx.report({
        path: "localization.uri",
        message: "localization.uri must be a string containing the {locale} placeholder.",
      });
    }
    if (typeof localization.default !== "string" || localization.default.length === 0) {
      ctx.report({
        path: "localization.default",
        message: "localization.default must be a non-empty string.",
      });
    }
    const locales = localization.locales;
    if (
      !Array.isArray(locales) ||
      locales.some((locale) => typeof locale !== "string" || !locale)
    ) {
      ctx.report({
        path: "localization.locales",
        message: "localization.locales must be an array of locale strings.",
      });
      return;
    }
    if (typeof localization.default === "string" && !locales.includes(localization.default)) {
      ctx.report({
        path: "localization.locales",
        message: `localization.locales must include the default locale "${localization.default}".`,
      });
    }
  },
});
