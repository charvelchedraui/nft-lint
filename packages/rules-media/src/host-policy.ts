import { defineRule, isLocalHost, parseUri, ruleDocUrl } from "@nft-lint/core";
import { mediaRefs } from "./fields.js";

export const hostPolicyRule = defineRule({
  id: "media/host-policy",
  chains: ["*"],
  standards: ["*"],
  severity: "warn",
  docs: ruleDocUrl("media/host-policy"),
  needsNetwork: false,
  check(ctx) {
    for (const ref of mediaRefs(ctx.json)) {
      const parsed = parseUri(ref.url);
      if (parsed.kind === "data") {
        ctx.report({
          path: ref.path,
          severity: "info",
          message: `${ref.path} is a data URI. Some marketplaces reject these, and they bloat the JSON.`,
        });
        continue;
      }
      if (parsed.kind !== "http") continue;
      if (isLocalHost(parsed.host)) {
        ctx.report({
          path: ref.path,
          severity: "error",
          message: `${ref.path} points at ${parsed.host}. Collectors cannot load a file that lives on your machine.`,
        });
      }
      if (!parsed.secure) {
        ctx.report({
          path: ref.path,
          message: `${ref.path} uses http://. Use https://.`,
        });
      }
      if (!isLocalHost(parsed.host)) {
        ctx.report({
          path: ref.path,
          message: `${ref.path} is hosted on ${parsed.host}. Prefer ipfs:// or ar:// so the file survives if that server goes away.`,
        });
      }
    }
  },
});
