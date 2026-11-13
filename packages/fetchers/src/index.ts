import type { ResolveOnChain } from "@nft-lint/core";
import { resolveEvm } from "./evm.js";
import { resolveMultichain } from "./multichain.js";
import { resolveSolana } from "./solana.js";

export const resolveOnChain: ResolveOnChain = (args) => {
  if (args.chain.family === "solana") return resolveSolana(args);
  if (args.chain.family === "evm") return resolveEvm(args);
  return resolveMultichain(args);
};

export {
  CORE_PROGRAM_ID,
  TOKEN_METADATA_PROGRAM_ID,
  mapCoreAsset,
  mapTokenMetadata,
  resolveSolana,
} from "./solana.js";
export {
  algorandReserveCid,
  resolveAlgorand,
  resolveAptos,
  resolveBitcoin,
  resolveCardano,
  resolveFlow,
  resolveMultichain,
  resolveStargaze,
  resolveSui,
  resolveTezos,
  resolveTon,
  resolveTron,
} from "./multichain.js";
export {
  ERC1155_INTERFACE,
  ERC2981_INTERFACE,
  ERC721_INTERFACE,
  createViemReader,
  erc1155Abi,
  erc721Abi,
  readEvmNft,
  resolveEvm,
} from "./evm.js";
export type { EvmReader } from "./evm.js";
