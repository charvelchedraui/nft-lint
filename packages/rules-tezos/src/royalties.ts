import { defineRule, isRecord, ruleDocUrl } from "@nft-lint/core";
import { isTezosAddress } from "./required.js";

/**
 * objkt royalty extension used across TZIP-21 token metadata.
 * shares are integers on a 10^decimals scale. 50 with decimals 3 is 5%.
 */
export const royaltiesRule = defineRule({
  id: "tezos/royalties",
  chains: ["tezos"],
  standards: ["tzip-21"],
  severity: "error",
  docs: ruleDocUrl("tezos/royalties"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json || !("royalties" in ctx.json)) return;
    const royalties = ctx.json.royalties;
    if (!isRecord(royalties)) {
      ctx.report({
        path: "royalties",
        message: 'royalties must be {"decimals": number, "shares": {address: amount}}.',
      });
      return;
    }
    const decimals = royalties.decimals;
    if (
      typeof decimals !== "number" ||
      !Number.isInteger(decimals) ||
      decimals < 0 ||
      decimals > 6
    ) {
      ctx.report({
        path: "royalties.decimals",
        message: "royalties.decimals must be an integer from 0 to 6. objkt commonly uses 3 or 4.",
      });
      return;
    }
    if (!isRecord(royalties.shares)) {
      ctx.report({
        path: "royalties.shares",
        message: "royalties.shares must be an object of tezos address to integer share.",
      });
      return;
    }
    const entries = Object.entries(royalties.shares);
    if (entries.length === 0) {
      ctx.report({
        path: "royalties.shares",
        severity: "warn",
        message: "royalties.shares is empty, so the royalty pays nobody.",
      });
      return;
    }
    const scale = 10 ** decimals;
    let sum = 0;
    let numeric = true;
    for (const [address, share] of entries) {
      if (!isTezosAddress(address)) {
        ctx.report({
          path: `royalties.shares.${address}`,
          message: `Royalty recipient "${address}" is not a tz1, tz2, tz3, tz4, or KT1 address. A name here cannot be paid.`,
        });
      }
      if (typeof share !== "number" || !Number.isInteger(share) || share < 0) {
        numeric = false;
        ctx.report({
          path: `royalties.shares.${address}`,
          message: "Each royalty share must be an integer >= 0.",
        });
        continue;
      }
      sum += share;
    }
    if (!numeric) return;
    if (sum > scale) {
      ctx.report({
        path: "royalties.shares",
        message: `Royalty shares add up to ${sum}, above the scale 10^${decimals} (${scale}). That is more than 100%.`,
      });
      return;
    }
    const percent = (sum / scale) * 100;
    if (percent > ctx.config.royaltyWarnAbovePercent) {
      ctx.report({
        path: "royalties.shares",
        severity: "warn",
        message: `Royalties total ${percent}%, above the ${ctx.config.royaltyWarnAbovePercent}% warning line.`,
      });
    }
  },
});
