import { defineRule } from "./define-rule.js";
import { looksLikeTezos } from "./detect.js";
import { isRecord, ruleDocUrl } from "./types.js";

export const jsonRule = defineRule({
  id: "common/json",
  chains: ["*"],
  standards: ["*"],
  severity: "error",
  docs: ruleDocUrl("common/json"),
  needsNetwork: false,
  check(ctx) {
    if (ctx.pathError) {
      ctx.report({ message: ctx.pathError });
      return;
    }
    if (ctx.encodingError) {
      ctx.report({ message: ctx.encodingError });
      return;
    }
    if (ctx.parse && !ctx.parse.ok) {
      ctx.report({ message: `Metadata is not valid JSON: ${ctx.parse.error}` });
      return;
    }
    if (ctx.parse?.hasBom) {
      ctx.report({
        severity: "warn",
        message:
          "File starts with a UTF-8 BOM. Remove it so hashes and strict parsers stay stable.",
      });
    }
    for (const dup of ctx.parse?.duplicatePaths ?? []) {
      const key = dup.split(".").pop() ?? dup;
      ctx.report({
        path: dup,
        message: `Duplicate key "${key}". JSON keeps the last value and drops the earlier one.`,
      });
    }
    if (ctx.raw == null && ctx.json == null && ctx.value == null && !ctx.requestedRemote) {
      ctx.report({
        message: "Nothing to lint. Pass JSON, a metadata URL, or chain:contract:tokenId.",
      });
      return;
    }
    if (
      (ctx.parse?.ok || (ctx.raw == null && ctx.value !== undefined)) &&
      ctx.value != null &&
      !isRecord(ctx.value)
    ) {
      const kind = Array.isArray(ctx.value) ? "an array" : `a ${typeof ctx.value}`;
      ctx.report({ message: `Metadata JSON must be an object, not ${kind}.` });
    }
  },
});

export const metadataFetchRule = defineRule({
  id: "common/metadata-fetch",
  chains: ["*"],
  standards: ["*"],
  severity: "error",
  docs: ruleDocUrl("common/metadata-fetch"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.requestedRemote || !ctx.fetchError) return;
    ctx.report({ message: ctx.fetchError });
  },
});

export const standardRule = defineRule({
  id: "common/standard",
  chains: ["*"],
  standards: ["*"],
  severity: "info",
  docs: ruleDocUrl("common/standard"),
  needsNetwork: false,
  check(ctx) {
    if (ctx.standard !== "unknown" || ctx.fetchError || ctx.json == null) return;
    if (looksLikeTezos(ctx.json)) {
      ctx.report({
        message:
          "This looks like Tezos TZIP-21 (artifactUri or displayUri). The Tezos rule pack is a stub, so those fields were not checked.",
      });
      return;
    }
    if (!isRecord(ctx.json)) return;
    ctx.report({
      message:
        "Could not tell which metadata standard this is. Expected ERC-721, ERC-1155, or Metaplex JSON.",
    });
  },
});

export const builtinRules = [jsonRule, metadataFetchRule, standardRule];
