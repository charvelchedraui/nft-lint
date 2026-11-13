import { defineRule, isRecord, ruleDocUrl } from "@nft-lint/core";

const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export const contractUriRule = defineRule({
  id: "evm/contract-uri",
  chains: ["evm"],
  standards: ["erc-721", "erc-1155"],
  severity: "warn",
  docs: ruleDocUrl("evm/contract-uri"),
  needsNetwork: false,
  check(ctx) {
    const onChain = ctx.onChain;
    if (!onChain || (onChain.kind !== "erc-721" && onChain.kind !== "erc-1155")) return;
    if (onChain.contractUri && onChain.contractMetadata === undefined) {
      ctx.report({
        path: "contractURI",
        message: `contractURI (${onChain.contractUri}) did not return JSON.`,
      });
      return;
    }
    if (onChain.contractMetadata === undefined) return;
    if (!isRecord(onChain.contractMetadata)) {
      ctx.report({ path: "contractURI", message: "contractURI JSON must be an object." });
      return;
    }
    const metadata = onChain.contractMetadata;
    if (typeof metadata.name !== "string" || metadata.name.trim() === "") {
      ctx.report({ path: "contractURI.name", message: "contractURI is missing a name." });
    }
    if (typeof metadata.image !== "string" || metadata.image.trim() === "") {
      ctx.report({ path: "contractURI.image", message: "contractURI is missing an image." });
    }
    if ("seller_fee_basis_points" in metadata) {
      const fee = metadata.seller_fee_basis_points;
      if (typeof fee !== "number" || !Number.isInteger(fee) || fee < 0 || fee > 10_000) {
        ctx.report({
          path: "contractURI.seller_fee_basis_points",
          severity: "error",
          message: "seller_fee_basis_points must be an integer from 0 to 10000.",
        });
      }
    }
    if ("fee_recipient" in metadata) {
      const recipient = metadata.fee_recipient;
      if (typeof recipient !== "string" || !ADDRESS.test(recipient)) {
        ctx.report({
          path: "contractURI.fee_recipient",
          severity: "error",
          message: "fee_recipient must be a 20-byte hex address.",
        });
      }
    }
  },
});
