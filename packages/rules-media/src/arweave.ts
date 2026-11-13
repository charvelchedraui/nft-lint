import { defineRule, parseUri, ruleDocUrl } from "@nft-lint/core";
import { mediaRefs } from "./fields.js";

export const arweaveUriRule = defineRule({
  id: "media/arweave-uri",
  chains: ["*"],
  standards: ["*"],
  severity: "error",
  docs: ruleDocUrl("media/arweave-uri"),
  needsNetwork: false,
  check(ctx) {
    for (const ref of mediaRefs(ctx.json)) {
      const parsed = parseUri(ref.url);
      if (parsed.kind !== "arweave") continue;
      if (!parsed.txValid) {
        ctx.report({
          path: ref.path,
          message: `Arweave transaction id in ${ref.path} must be 43 base64url characters.`,
        });
      }
    }
  },
});
