import { defineRule, isRecord, ruleDocUrl } from "@nft-lint/core";

const ZERO = "0x0000000000000000000000000000000000000000";

export const eip2981Rule = defineRule({
  id: "evm/eip2981",
  chains: ["evm"],
  standards: ["erc-721", "erc-1155"],
  severity: "warn",
  docs: ruleDocUrl("evm/eip2981"),
  needsNetwork: false,
  check(ctx) {
    const onChain = ctx.onChain;
    if (!onChain || (onChain.kind !== "erc-721" && onChain.kind !== "erc-1155")) return;
    if (onChain.supports2981 === undefined && onChain.readError) {
      ctx.report({
        path: "royaltyInfo",
        message: `Could not read EIP-2981: ${onChain.readError}`,
      });
      return;
    }
    if (onChain.supports2981 === false) {
      ctx.report({
        path: "supportsInterface",
        message:
          "Contract does not advertise EIP-2981 (supportsInterface 0x2a55205a). Marketplaces may ignore royalties.",
      });
      return;
    }
    if (onChain.supports2981 !== true) return;
    if (!onChain.royalty) {
      ctx.report({
        path: "royaltyInfo",
        severity: "error",
        message:
          "Contract advertises EIP-2981 but royaltyInfo did not return a receiver and amount.",
      });
      return;
    }
    if (onChain.royalty.receiver.toLowerCase() === ZERO) {
      ctx.report({
        path: "royaltyInfo",
        message: "EIP-2981 receiver is the zero address, so the royalty goes nowhere.",
      });
    }
    let sale: bigint;
    let amount: bigint;
    try {
      sale = BigInt(onChain.royalty.salePrice);
      amount = BigInt(onChain.royalty.amount);
    } catch {
      ctx.report({
        path: "royaltyInfo",
        severity: "error",
        message: "royaltyInfo amount could not be parsed.",
      });
      return;
    }
    if (sale > 0n && amount > sale) {
      ctx.report({
        path: "royaltyInfo",
        severity: "error",
        message: "EIP-2981 royalty is larger than the sale price.",
      });
    }
    const percent = sale === 0n ? 0 : Number((amount * 10_000n) / sale) / 100;
    if (percent > ctx.config.royaltyWarnAbovePercent) {
      ctx.report({
        path: "royaltyInfo",
        message: `Royalty is ${percent}%, above the ${ctx.config.royaltyWarnAbovePercent}% warning line.`,
      });
    }
    compareContract(ctx, onChain.contractMetadata, onChain.royalty.receiver, sale, amount);
  },
});

function compareContract(
  ctx: Parameters<typeof eip2981Rule.check>[0],
  metadata: unknown,
  receiver: string,
  sale: bigint,
  amount: bigint,
) {
  if (!isRecord(metadata) || sale <= 0n) return;
  const fee = metadata.seller_fee_basis_points;
  if (typeof fee === "number") {
    const onChainBps = Number((amount * 10_000n) / sale);
    if (onChainBps !== fee) {
      ctx.report({
        path: "contractURI.seller_fee_basis_points",
        message: `contractURI says ${fee} basis points, but royaltyInfo returns ${onChainBps}.`,
      });
    }
  }
  const recipient = metadata.fee_recipient;
  if (typeof recipient === "string" && recipient.toLowerCase() !== receiver.toLowerCase()) {
    ctx.report({
      path: "contractURI.fee_recipient",
      message: `contractURI fee recipient ${recipient} does not match the EIP-2981 receiver ${receiver}.`,
    });
  }
}
