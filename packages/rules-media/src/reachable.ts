import { defineRule, ruleDocUrl } from "@nft-lint/core";
import { mediaRefs } from "./fields.js";

export const reachableRule = defineRule({
  id: "media/reachable",
  chains: ["*"],
  standards: ["*"],
  severity: "error",
  docs: ruleDocUrl("media/reachable"),
  needsNetwork: true,
  async check(ctx) {
    for (const ref of mediaRefs(ctx.json)) {
      const probe = await ctx.probe(ref.url);
      if (probe.ok) continue;
      const status = probe.status ? ` (HTTP ${probe.status})` : "";
      const detail = probe.error ? `: ${probe.error}` : "";
      ctx.report({
        path: ref.path,
        message: `${ref.path} did not load${status}${detail}.`,
      });
    }
  },
});
