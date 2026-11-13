import { defineRule, isRecord, metadataUriIssue, ruleDocUrl } from "@nft-lint/core";

const HASH = /^[0-9a-fA-F]{64}$/;
const MIME = /^[\w.+-]+\/[\w.+-]+$/;

export const formatsRule = defineRule({
  id: "tezos/formats",
  chains: ["tezos"],
  standards: ["tzip-21"],
  severity: "error",
  docs: ruleDocUrl("tezos/formats"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    if (!("formats" in json)) {
      ctx.report({
        path: "formats",
        severity: "warn",
        message:
          "formats is missing. objkt uses each entry's uri and mimeType when artifactUri alone is not enough.",
      });
      return;
    }
    if (!Array.isArray(json.formats)) {
      ctx.report({
        path: "formats",
        message: "formats must be an array of {uri, mimeType} objects.",
      });
      return;
    }
    if (json.formats.length === 0) {
      ctx.report({
        path: "formats",
        severity: "warn",
        message: "formats is empty. Add one entry per file, including the display image.",
      });
      return;
    }
    json.formats.forEach((format, index) => {
      const path = `formats[${index}]`;
      if (!isRecord(format)) {
        ctx.report({
          path,
          message: "Each formats entry must be an object with uri and mimeType.",
        });
        return;
      }
      if (typeof format.uri !== "string") {
        ctx.report({ path: `${path}.uri`, message: "formats uri must be a string." });
      } else {
        const issue = metadataUriIssue(format.uri);
        if (issue) ctx.report({ path: `${path}.uri`, message: `formats uri ${issue}` });
      }
      if (typeof format.mimeType !== "string" || !MIME.test(format.mimeType)) {
        ctx.report({
          path: `${path}.mimeType`,
          message: "mimeType must be a type/subtype string, such as image/png.",
        });
      }
      if ("hash" in format && (typeof format.hash !== "string" || !HASH.test(format.hash))) {
        ctx.report({
          path: `${path}.hash`,
          message: "hash must be a 64-character hex SHA-256 digest when it is set.",
        });
      }
      if (
        "fileSize" in format &&
        (typeof format.fileSize !== "number" ||
          !Number.isInteger(format.fileSize) ||
          format.fileSize < 0)
      ) {
        ctx.report({
          path: `${path}.fileSize`,
          message: "fileSize must be an integer number of bytes.",
        });
      }
      if ("dimensions" in format) {
        const dimensions = format.dimensions;
        if (
          !isRecord(dimensions) ||
          typeof dimensions.value !== "string" ||
          dimensions.value.trim() === "" ||
          typeof dimensions.unit !== "string" ||
          dimensions.unit.trim() === ""
        ) {
          ctx.report({
            path: `${path}.dimensions`,
            message: 'dimensions must be {"value": "1024x1024", "unit": "px"}.',
          });
        }
      }
    });
  },
});
