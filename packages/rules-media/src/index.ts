import { arweaveUriRule } from "./arweave.js";
import { hostPolicyRule } from "./host-policy.js";
import { ipfsGatewaysRule, ipfsUriRule } from "./ipfs.js";
import { mimeRule } from "./mime.js";
import { reachableRule } from "./reachable.js";
import { sizeRule } from "./size.js";

export const mediaRules = [
  ipfsUriRule,
  ipfsGatewaysRule,
  arweaveUriRule,
  hostPolicyRule,
  reachableRule,
  mimeRule,
  sizeRule,
];

export {
  arweaveUriRule,
  hostPolicyRule,
  ipfsGatewaysRule,
  ipfsUriRule,
  mimeRule,
  reachableRule,
  sizeRule,
};
