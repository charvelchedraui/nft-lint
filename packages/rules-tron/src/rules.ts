import { defineRule, metadataUriIssue, ruleDocUrl, type RuleContext } from "@nft-lint/core";
import { isTronAddress } from "./address.js";

const EXPLORER = /tronscan\.org|tronscan\.io/i;

function tokenUri(ctx: RuleContext): string | undefined {
  const onChain = ctx.onChain;
  if (onChain?.kind === "trc-721" && onChain.uri) return onChain.uri;
  if (typeof ctx.uri === "string" && ctx.chain?.family === "tron") return ctx.uri;
  const json = ctx.json;
  if (json && typeof json.token_uri === "string") return json.token_uri;
  return undefined;
}

export const tokenUriRule = defineRule({
  id: "tron/token-uri",
  chains: ["tron"],
  standards: ["trc-721"],
  severity: "error",
  docs: ruleDocUrl("tron/token-uri"),
  needsNetwork: false,
  check(ctx) {
    const uri = tokenUri(ctx);
    if (uri === undefined) {
      if (ctx.contract && ctx.onChain?.kind === "trc-721") {
        ctx.report({
          path: "tokenURI",
          message: "TRC-721 tokenURI was empty. Wallets cannot load metadata without it.",
        });
      }
      return;
    }
    if (uri.trim() === "") {
      ctx.report({ path: "tokenURI", message: "tokenURI is empty." });
      return;
    }
    if (EXPLORER.test(uri)) {
      ctx.report({
        path: "tokenURI",
        message:
          "tokenURI points at a Tronscan page. It must point at the JSON file (ipfs://, btfs, or https), not the explorer.",
      });
      return;
    }
    const issue = metadataUriIssue(uri);
    if (issue) ctx.report({ path: "tokenURI", message: `tokenURI ${issue}` });
  },
});

export const tokenUriHtmlRule = defineRule({
  id: "tron/token-uri-html",
  chains: ["tron"],
  standards: ["trc-721"],
  severity: "error",
  docs: ruleDocUrl("tron/token-uri-html"),
  needsNetwork: true,
  async check(ctx) {
    const uri = tokenUri(ctx);
    if (!uri || uri.trim() === "" || EXPLORER.test(uri)) return;
    const onChain = ctx.onChain?.kind === "trc-721" ? ctx.onChain : null;
    if (onChain?.contentType?.toLowerCase().includes("text/html")) {
      ctx.report({
        path: "tokenURI",
        message:
          "tokenURI returned text/html. TRC-721 metadata must be a JSON object with name, description, and image.",
      });
      return;
    }
    const probe = await ctx.probe(uri);
    const type = probe.contentType?.toLowerCase() ?? "";
    const head = new TextDecoder().decode(probe.body.slice(0, 80)).trim().toLowerCase();
    if (type.includes("text/html") || head.startsWith("<!doctype") || head.startsWith("<html")) {
      ctx.report({
        path: "tokenURI",
        message:
          "tokenURI returned an HTML page. The host is probably an error or a website, not the metadata JSON.",
      });
    }
  },
});

export const addressRule = defineRule({
  id: "tron/address",
  chains: ["tron"],
  standards: ["trc-721"],
  severity: "error",
  docs: ruleDocUrl("tron/address"),
  needsNetwork: false,
  async check(ctx) {
    if (!ctx.contract) return;
    if (!(await isTronAddress(ctx.contract))) {
      ctx.report({
        path: "contract",
        message: `Contract "${ctx.contract}" is not a mainnet base58check address (34 characters, starts with T, prefix byte 0x41).`,
      });
    }
  },
});

export const idPlaceholderRule = defineRule({
  id: "tron/id-placeholder",
  chains: ["tron"],
  standards: ["trc-721"],
  severity: "error",
  docs: ruleDocUrl("tron/id-placeholder"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    for (const field of ["image", "animation_url", "external_url"] as const) {
      const value = json[field];
      if (typeof value !== "string") continue;
      if (/\{id\}/i.test(value)) {
        ctx.report({
          path: field,
          message: `${field} contains {id}. That substitution is TRC-1155. A TRC-721 tokenURI is one document per token.`,
        });
      }
    }
    const uri = tokenUri(ctx);
    if (uri && /\{id\}/i.test(uri)) {
      ctx.report({
        path: "tokenURI",
        message: "tokenURI contains {id}. TRC-721 does not substitute the token id into the URI.",
      });
    }
  },
});
