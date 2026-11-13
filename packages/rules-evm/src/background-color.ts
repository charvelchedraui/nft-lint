import { defineRule, ruleDocUrl } from "@nft-lint/core";

export const backgroundColorRule = defineRule({
  id: "common/background-color",
  chains: ["*"],
  standards: ["erc-721", "erc-1155", "metaplex-token-metadata", "metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("common/background-color"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("background_color" in ctx.json)) return;
    const color = ctx.json.background_color;
    if (typeof color !== "string") {
      ctx.report({
        path: "background_color",
        message: "background_color must be a 6-character hex string without a leading #.",
      });
      return;
    }
    if (color.startsWith("#")) {
      ctx.report({
        path: "background_color",
        message: `background_color must not start with #. Use "${color.slice(1)}" when that leaves six hex digits.`,
      });
      return;
    }
    if (!/^[0-9A-Fa-f]{6}$/.test(color)) {
      ctx.report({
        path: "background_color",
        message: "background_color must be exactly 6 hex characters (0-9, a-f) with no # prefix.",
      });
    }
  },
});
