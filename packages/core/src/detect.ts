import type { ChainDefinition, OnChainFacts, StandardId } from "./types.js";
import { isRecord } from "./types.js";

export function detectStandard(
  json: unknown,
  hint: {
    chain: ChainDefinition | null;
    standard?: StandardId;
    uri?: string;
    onChain: OnChainFacts | null;
  },
): StandardId {
  if (hint.standard && hint.standard !== "unknown") return hint.standard;
  if (hint.onChain?.kind === "erc-1155") return "erc-1155";
  if (hint.onChain?.kind === "erc-721") return "erc-721";
  if (hint.onChain?.kind === "metaplex-core") return "metaplex-core";
  if (hint.onChain?.kind === "metaplex-token-metadata") return "metaplex-token-metadata";
  if (hint.chain?.family !== "solana" && hint.uri?.includes("{id}")) return "erc-1155";
  if (looksLikeTezos(json)) return "unknown";
  if (looksLikeMetaplex(json)) return "metaplex-token-metadata";
  if (hint.chain?.family === "solana") return "metaplex-token-metadata";
  if (hint.onChain?.kind === "erc-1155") return "erc-1155";
  if (hint.chain?.family === "evm") return "erc-721";
  if (isRecord(json) && ("name" in json || "image" in json || "description" in json)) {
    return "erc-721";
  }
  return "unknown";
}

export function looksLikeTezos(json: unknown): boolean {
  if (!isRecord(json)) return false;
  return typeof json.artifactUri === "string" || typeof json.displayUri === "string";
}

export function looksLikeMetaplex(json: unknown): boolean {
  if (!isRecord(json) || typeof json.symbol !== "string") return false;
  if (typeof json.seller_fee_basis_points === "number") return true;
  if (!isRecord(json.properties)) return false;
  return Array.isArray(json.properties.files) || typeof json.properties.category === "string";
}

export function familyOf(standard: StandardId): "evm" | "solana" | null {
  if (standard === "erc-721" || standard === "erc-1155") return "evm";
  if (standard === "metaplex-token-metadata" || standard === "metaplex-core") return "solana";
  return null;
}
