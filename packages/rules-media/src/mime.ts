import { defineRule, ruleDocUrl } from "@nft-lint/core";
import { declaredMime, mediaRefs } from "./fields.js";
import { extensionOf, mimeForExtension, sniffMime } from "./sniff.js";

export const mimeRule = defineRule({
  id: "media/mime",
  chains: ["*"],
  standards: ["*"],
  severity: "warn",
  docs: ruleDocUrl("media/mime"),
  needsNetwork: true,
  async check(ctx) {
    for (const ref of mediaRefs(ctx.json)) {
      const probe = await ctx.probe(ref.url);
      if (!probe.ok || probe.body.byteLength === 0) continue;
      const sniffed = await sniffMime(probe.body);
      if (!sniffed) continue;
      if (sniffed === "text/html" || sniffed === "application/json") {
        ctx.report({
          path: ref.path,
          severity: "error",
          message: `${ref.path} returned ${sniffed}, not media. The gateway or host is probably showing an error page.`,
        });
        continue;
      }
      const expected = mimeForExtension(extensionOf(ref.url));
      if (expected && !expected.includes(sniffed)) {
        ctx.report({
          path: ref.path,
          message: `${ref.path} looks like ${sniffed}, but the URL ends in .${extensionOf(ref.url)}.`,
        });
      }
      const declared = declaredMime(ctx.json, ref.url);
      if (declared && declared !== sniffed) {
        ctx.report({
          path: ref.path,
          message: `${ref.path} looks like ${sniffed}, but the metadata declares ${declared}.`,
        });
      }
    }
  },
});
