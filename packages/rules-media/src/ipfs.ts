import { defineRule, parseUri, ruleDocUrl } from "@nft-lint/core";
import { mediaRefs } from "./fields.js";

export const ipfsUriRule = defineRule({
  id: "media/ipfs-uri",
  chains: ["*"],
  standards: ["*"],
  severity: "error",
  docs: ruleDocUrl("media/ipfs-uri"),
  needsNetwork: false,
  check(ctx) {
    for (const ref of mediaRefs(ctx.json)) {
      const parsed = parseUri(ref.url);
      if (parsed.kind !== "ipfs") continue;
      if (!parsed.cidValid) {
        ctx.report({
          path: ref.path,
          message: `Invalid IPFS CID in ${ref.path}.`,
        });
        continue;
      }
      if (parsed.gatewayHost) {
        ctx.report({
          path: ref.path,
          severity: "warn",
          message: `${ref.path} hardcodes the ${parsed.gatewayHost} gateway. Use ipfs://${parsed.cid}${parsed.path ? `/${parsed.path}` : ""} so clients can pick a gateway.`,
        });
      }
      if (parsed.redundantPrefix) {
        ctx.report({
          path: ref.path,
          severity: "warn",
          message: `${ref.path} uses an extra "ipfs/" prefix. Prefer ipfs://${parsed.cid}${parsed.path ? `/${parsed.path}` : ""}.`,
        });
      }
    }
  },
});

export const ipfsGatewaysRule = defineRule({
  id: "media/ipfs-gateways",
  chains: ["*"],
  standards: ["*"],
  severity: "error",
  docs: ruleDocUrl("media/ipfs-gateways"),
  needsNetwork: true,
  async check(ctx) {
    for (const ref of mediaRefs(ctx.json)) {
      const parsed = parseUri(ref.url);
      if (parsed.kind !== "ipfs" || !parsed.cidValid) continue;
      const probe = await ctx.probe(ref.url);
      const gateways = probe.gateways ?? [];
      if (gateways.length === 0) continue;
      const ok = gateways.filter((gateway) => gateway.ok);
      const failed = gateways.filter((gateway) => !gateway.ok);
      if (ok.length === 0) {
        ctx.report({
          path: ref.path,
          message: `${ref.path} did not load on any configured IPFS gateway.`,
        });
      } else if (failed.length > 0) {
        ctx.report({
          path: ref.path,
          severity: "warn",
          message: `${ref.path} loaded via ${ok.map((gateway) => gateway.gateway).join(", ")}, but failed on ${failed.map((gateway) => gateway.gateway).join(", ")}.`,
        });
      }
    }
  },
});
