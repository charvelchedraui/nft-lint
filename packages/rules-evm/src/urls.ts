import { defineRule, parseUri, ruleDocUrl } from "@nft-lint/core";

const YOUTUBE =
  /^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)[\w-]{6,}(?:[&?].*)?$/;

export const externalUrlRule = defineRule({
  id: "common/external-url",
  chains: ["*"],
  standards: ["erc-721", "erc-1155", "metaplex-token-metadata", "metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("common/external-url"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || typeof ctx.json.external_url !== "string") return;
    if (!ctx.json.external_url.trim()) {
      ctx.report({ path: "external_url", message: "external_url is empty." });
      return;
    }
    const parsed = parseUri(ctx.json.external_url);
    if (parsed.kind !== "http") {
      ctx.report({
        path: "external_url",
        message: "external_url must be an absolute http(s) URL.",
      });
      return;
    }
    if (!parsed.secure) {
      ctx.report({
        path: "external_url",
        severity: "warn",
        message: "external_url uses http://. Prefer https:// so browsers do not block it.",
      });
    }
  },
});

export const animationUrlRule = defineRule({
  id: "common/animation-url",
  chains: ["*"],
  standards: ["erc-721", "erc-1155", "metaplex-token-metadata", "metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("common/animation-url"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || typeof ctx.json.animation_url !== "string") return;
    if (!ctx.json.animation_url.trim()) {
      ctx.report({ path: "animation_url", message: "animation_url is empty." });
      return;
    }
    const parsed = parseUri(ctx.json.animation_url);
    if (parsed.kind === "invalid") {
      ctx.report({
        path: "animation_url",
        message: `animation_url is not a usable URI (${parsed.reason})`,
      });
    }
  },
});

export const youtubeUrlRule = defineRule({
  id: "common/youtube-url",
  chains: ["*"],
  standards: ["erc-721", "erc-1155", "metaplex-token-metadata", "metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("common/youtube-url"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || typeof ctx.json.youtube_url !== "string") return;
    if (!YOUTUBE.test(ctx.json.youtube_url.trim())) {
      ctx.report({
        path: "youtube_url",
        message: "youtube_url must be an https youtube.com or youtu.be video URL.",
      });
    }
  },
});
