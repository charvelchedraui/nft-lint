import { defineRule, ruleDocUrl } from "@nft-lint/core";
import { mediaRefs } from "./fields.js";

export const sizeRule = defineRule({
  id: "media/size",
  chains: ["*"],
  standards: ["*"],
  severity: "warn",
  docs: ruleDocUrl("media/size"),
  needsNetwork: true,
  async check(ctx) {
    for (const ref of mediaRefs(ctx.json)) {
      const probe = await ctx.probe(ref.url);
      if (probe.contentLength === undefined) continue;
      const limit =
        ref.role === "thumbnail" ? ctx.config.maxThumbnailBytes : ctx.config.maxImageBytes;
      if (probe.contentLength > limit) {
        ctx.report({
          path: ref.path,
          message: `${ref.path} is ${probe.contentLength} bytes, over the ${limit} byte limit.`,
        });
      }
    }
  },
});
