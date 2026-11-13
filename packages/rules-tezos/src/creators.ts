import { defineRule, ruleDocUrl } from "@nft-lint/core";
import { isTezosAddress } from "./required.js";

export const creatorsRule = defineRule({
  id: "tezos/creators",
  chains: ["tezos"],
  standards: ["tzip-21"],
  severity: "error",
  docs: ruleDocUrl("tezos/creators"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    if ("minter" in json) {
      if (typeof json.minter !== "string" || !isTezosAddress(json.minter)) {
        ctx.report({
          path: "minter",
          message: "minter must be a tz1, tz2, tz3, tz4, or KT1 address.",
        });
      }
    }
    if (!("creators" in json)) {
      ctx.report({
        path: "creators",
        severity: "warn",
        message:
          "creators is missing. objkt only shows a creator profile when the array contains a tezos address.",
      });
      return;
    }
    if (!Array.isArray(json.creators)) {
      ctx.report({ path: "creators", message: "creators must be an array of strings." });
      return;
    }
    const seen = new Set<string>();
    let addressCount = 0;
    json.creators.forEach((creator, index) => {
      if (typeof creator !== "string" || creator.trim() === "") {
        ctx.report({
          path: `creators[${index}]`,
          message: "Each creator must be a non-empty string.",
        });
        return;
      }
      if (seen.has(creator)) {
        ctx.report({
          path: `creators[${index}]`,
          message: `Duplicate creator "${creator}". TZIP-21 requires unique creator entries.`,
        });
      }
      seen.add(creator);
      if (isTezosAddress(creator)) addressCount += 1;
    });
    if (json.creators.length > 0 && addressCount === 0) {
      ctx.report({
        path: "creators",
        severity: "warn",
        message:
          "creators has no tezos address. Names are allowed, but objkt will not link the token to a profile without one.",
      });
    }
  },
});
