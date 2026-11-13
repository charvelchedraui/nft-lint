import { defineRule, isRecord, ruleDocUrl } from "@nft-lint/core";

export const creatorsFeeRule = defineRule({
  id: "solana/creators-fee",
  chains: ["solana"],
  standards: ["metaplex-token-metadata", "metaplex-core"],
  severity: "error",
  docs: ruleDocUrl("solana/creators-fee"),
  needsNetwork: false,
  check(ctx) {
    const properties = ctx.json && isRecord(ctx.json.properties) ? ctx.json.properties : null;
    if (properties && "creators" in properties) {
      checkCreators(ctx, "properties.creators", properties.creators);
    }
    if (ctx.json && "seller_fee_basis_points" in ctx.json) {
      checkFee(ctx, "seller_fee_basis_points", ctx.json.seller_fee_basis_points);
    }
    const onChain = ctx.onChain;
    if (
      !onChain ||
      (onChain.kind !== "metaplex-token-metadata" && onChain.kind !== "metaplex-core")
    ) {
      return;
    }
    if (onChain.creators) checkCreators(ctx, "onChain.creators", onChain.creators);
    if (onChain.sellerFeeBasisPoints !== undefined) {
      checkFee(ctx, "onChain.sellerFeeBasisPoints", onChain.sellerFeeBasisPoints);
    }
  },
});

function checkCreators(
  ctx: Parameters<typeof creatorsFeeRule.check>[0],
  path: string,
  creators: unknown,
) {
  if (!Array.isArray(creators)) {
    ctx.report({ path, message: "creators must be an array." });
    return;
  }
  if (creators.length === 0) {
    ctx.report({
      path,
      severity: "warn",
      message: "creators is empty. A Metaplex NFT usually lists at least one creator.",
    });
    return;
  }
  let sum = 0;
  let sharesAreNumbers = true;
  creators.forEach((creator, index) => {
    if (
      !isRecord(creator) ||
      typeof creator.share !== "number" ||
      !Number.isInteger(creator.share)
    ) {
      sharesAreNumbers = false;
      ctx.report({ path: `${path}[${index}].share`, message: "creator share must be an integer." });
      return;
    }
    sum += creator.share;
  });
  if (sharesAreNumbers && sum !== 100) {
    ctx.report({
      path,
      message: `creator shares add up to ${sum}. They must add up to 100.`,
    });
  }
}

function checkFee(ctx: Parameters<typeof creatorsFeeRule.check>[0], path: string, fee: unknown) {
  if (typeof fee !== "number" || !Number.isInteger(fee) || fee < 0 || fee > 10_000) {
    ctx.report({
      path,
      message: "seller_fee_basis_points must be an integer from 0 to 10000.",
    });
    return;
  }
  const percent = fee / 100;
  if (percent > ctx.config.royaltyWarnAbovePercent) {
    ctx.report({
      path,
      severity: "warn",
      message: `seller_fee_basis_points is ${fee} (${percent}%), above the ${ctx.config.royaltyWarnAbovePercent}% warning line.`,
    });
  }
}
