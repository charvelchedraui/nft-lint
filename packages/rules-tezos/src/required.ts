import { defineRule, metadataUriIssue, ruleDocUrl } from "@nft-lint/core";

const URI_FIELDS = ["artifactUri", "displayUri", "thumbnailUri"] as const;

/**
 * TZIP-21 base metadata plus the NFT fields objkt and teia display.
 * `decimals` is the only field TZIP-21 marks required. A collectible also
 * needs a name or symbol and the three artwork URIs.
 */
export const requiredFieldsRule = defineRule({
  id: "tezos/required-fields",
  chains: ["tezos"],
  standards: ["tzip-21"],
  severity: "error",
  docs: ruleDocUrl("tezos/required-fields"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    if (
      typeof json.decimals !== "number" ||
      !Number.isInteger(json.decimals) ||
      json.decimals < 0
    ) {
      ctx.report({
        path: "decimals",
        message: "decimals is required and must be an integer >= 0. Use 0 for a 1/1 NFT.",
      });
    } else if (
      json.decimals !== 0 &&
      (json.artifactUri !== undefined || json.isBooleanAmount === true)
    ) {
      ctx.report({
        path: "decimals",
        severity: "warn",
        message:
          "NFT metadata should use decimals 0. A non-zero decimals reads as a fungible or semi-fungible token.",
      });
    }
    const hasName = typeof json.name === "string" && json.name.trim() !== "";
    const hasSymbol = typeof json.symbol === "string" && json.symbol.trim() !== "";
    if (!hasName && !hasSymbol) {
      ctx.report({
        path: "name",
        message: "TZIP-21 requires name or symbol. Marketplaces title the token from name.",
      });
    }
    if (json.description !== undefined && typeof json.description !== "string") {
      ctx.report({ path: "description", message: "description must be a string." });
    } else if (json.description === "") {
      ctx.report({
        path: "description",
        severity: "warn",
        message: "description is empty. objkt and teia will show a blank token.",
      });
    }
    for (const field of URI_FIELDS) {
      if (!(field in json)) {
        ctx.report({
          path: field,
          message: `${field} is missing. TZIP-21 NFTs use artifactUri for the file, displayUri for the preview, and thumbnailUri for lists.`,
        });
        continue;
      }
      const issue =
        typeof json[field] === "string" ? metadataUriIssue(json[field]) : "must be a string.";
      if (issue) ctx.report({ path: field, message: `${field} ${issue}` });
    }
    if ("isBooleanAmount" in json && typeof json.isBooleanAmount !== "boolean") {
      ctx.report({ path: "isBooleanAmount", message: "isBooleanAmount must be a boolean." });
    } else if (json.decimals === 0 && json.isBooleanAmount !== true) {
      ctx.report({
        path: "isBooleanAmount",
        severity: "warn",
        message:
          "Set isBooleanAmount to true when decimals is 0. FA2 wallets then treat the balance as a single NFT.",
      });
    }
    if ("tags" in json) checkTags(ctx, json.tags);
    if ("rights" in json && typeof json.rights !== "string") {
      ctx.report({ path: "rights", message: "rights must be a string, such as the license name." });
    }
    if ("rightsUri" in json) {
      const issue =
        typeof json.rightsUri === "string" ? metadataUriIssue(json.rightsUri) : "must be a string.";
      if (issue) ctx.report({ path: "rightsUri", message: `rightsUri ${issue}` });
    }
  },
});

function checkTags(ctx: Parameters<typeof requiredFieldsRule.check>[0], tags: unknown) {
  if (!Array.isArray(tags)) {
    ctx.report({ path: "tags", message: "tags must be an array of strings." });
    return;
  }
  tags.forEach((tag, index) => {
    if (typeof tag !== "string" || tag.trim() === "") {
      ctx.report({ path: `tags[${index}]`, message: "Each tag must be a non-empty string." });
    }
  });
}

export function isTezosAddress(value: string): boolean {
  return /^(tz[1-4]|KT1)[1-9A-HJ-NP-Za-km-z]{33}$/.test(value);
}
