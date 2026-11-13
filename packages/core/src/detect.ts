import type { ChainDefinition, ChainFamily, OnChainFacts, StandardId } from "./types.js";
import { isRecord } from "./types.js";

const ON_CHAIN_STANDARD: Partial<Record<OnChainFacts["kind"], StandardId>> = {
  "erc-721": "erc-721",
  "erc-1155": "erc-1155",
  "metaplex-core": "metaplex-core",
  "metaplex-token-metadata": "metaplex-token-metadata",
  "tzip-21": "tzip-21",
  "tzip-16": "tzip-16",
  ordinals: "ordinals",
  "tep-64": "tep-64",
  "flow-metadata-views": "flow-metadata-views",
  "trc-721": "trc-721",
  "cip-25": "cip-25",
  "cip-68": "cip-68",
  "arc-3": "arc-3",
  "arc-19": "arc-19",
  "arc-69": "arc-69",
  "sui-display": "sui-display",
  "aptos-digital-asset": "aptos-digital-asset",
  cw721: "cw721",
};

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
  const fromChain = hint.onChain ? ON_CHAIN_STANDARD[hint.onChain.kind] : undefined;
  if (fromChain) return fromChain;
  if (
    hint.chain?.family !== "solana" &&
    hint.chain?.family !== "algorand" &&
    hint.uri?.includes("{id}") &&
    !hint.uri.includes("template-ipfs://") &&
    !hint.uri.includes("{ipfscid:")
  ) {
    return "erc-1155";
  }
  const fromDocument = detectDocument(json, hint.uri);
  if (fromDocument) return fromDocument;
  if (hint.chain?.family === "solana") return "metaplex-token-metadata";
  if (hint.chain?.family === "evm") return "erc-721";
  if (hint.chain) return defaultStandard(hint.chain.family);
  if (isRecord(json) && ("name" in json || "image" in json || "description" in json)) {
    return "erc-721";
  }
  return "unknown";
}

export function looksLikeTezos(json: unknown): boolean {
  if (!isRecord(json)) return false;
  return (
    typeof json.artifactUri === "string" ||
    typeof json.displayUri === "string" ||
    typeof json.thumbnailUri === "string"
  );
}

export function looksLikeMetaplex(json: unknown): boolean {
  if (!isRecord(json) || typeof json.symbol !== "string") return false;
  if (typeof json.seller_fee_basis_points === "number") return true;
  if (!isRecord(json.properties)) return false;
  return Array.isArray(json.properties.files) || typeof json.properties.category === "string";
}

export function familyOf(standard: StandardId): ChainFamily | null {
  switch (standard) {
    case "erc-721":
    case "erc-1155":
      return "evm";
    case "metaplex-token-metadata":
    case "metaplex-core":
      return "solana";
    case "tzip-21":
    case "tzip-16":
      return "tezos";
    case "ordinals":
      return "bitcoin";
    case "tep-64":
      return "ton";
    case "flow-metadata-views":
      return "flow";
    case "trc-721":
      return "tron";
    case "cip-25":
    case "cip-68":
      return "cardano";
    case "arc-3":
    case "arc-19":
    case "arc-69":
      return "algorand";
    case "sui-display":
      return "sui";
    case "aptos-digital-asset":
      return "aptos";
    case "cw721":
      return "stargaze";
    default:
      return null;
  }
}

function defaultStandard(family: ChainFamily): StandardId {
  switch (family) {
    case "evm":
      return "erc-721";
    case "solana":
      return "metaplex-token-metadata";
    case "tezos":
      return "tzip-21";
    case "bitcoin":
      return "ordinals";
    case "ton":
      return "tep-64";
    case "flow":
      return "flow-metadata-views";
    case "tron":
      return "trc-721";
    case "cardano":
      return "cip-25";
    case "algorand":
      return "arc-3";
    case "sui":
      return "sui-display";
    case "aptos":
      return "aptos-digital-asset";
    case "stargaze":
      return "cw721";
  }
}

function detectDocument(json: unknown, uri: string | undefined): StandardId | null {
  if (uri && (uri.includes("template-ipfs://") || uri.includes("{ipfscid:"))) return "arc-19";
  if (!isRecord(json)) return null;
  if (looksLikeTezos(json)) return "tzip-21";
  if (
    Array.isArray(json.interfaces) &&
    json.interfaces.some((item) => typeof item === "string" && item.toUpperCase().includes("TZIP"))
  ) {
    return "tzip-16";
  }
  if ("721" in json || "777" in json) return "cip-25";
  if (isCip68(json)) return "cip-68";
  if (json.standard === "arc69") return "arc-69";
  if (
    typeof json.image_mimetype === "string" ||
    typeof json.image_integrity === "string" ||
    typeof json.animation_url_mimetype === "string"
  ) {
    return "arc-3";
  }
  if (isRecord(json.display) && ("name" in json.display || "thumbnail" in json.display)) {
    return "flow-metadata-views";
  }
  if (isRecord(json.collectionDisplay) || hasFlowRoyalty(json)) return "flow-metadata-views";
  if (typeof json.image_url === "string") return "sui-display";
  if (isAptosProperties(json)) return "aptos-digital-asset";
  if (isRecord(json.royalty) && typeof json.royalty.payee_address === "string") {
    return "aptos-digital-asset";
  }
  if (typeof json.token_uri === "string" && isRecord(json.extension)) return "cw721";
  if (
    isRecord(json.extension) &&
    (typeof json.extension.image === "string" || typeof json.extension.animation_url === "string")
  ) {
    return "cw721";
  }
  if (isRecord(json.royalty_info) && typeof json.royalty_info.share === "string") return "cw721";
  if (
    typeof json.content_url === "string" ||
    typeof json.image_data === "string" ||
    isRecord(json.royalty_params)
  ) {
    return "tep-64";
  }
  if (typeof json.inscription_id === "string" || typeof json.inscription_icon === "string") {
    return "ordinals";
  }
  if (
    typeof json.content_type === "string" &&
    (typeof json.parent === "string" || typeof json.delegate === "string")
  ) {
    return "ordinals";
  }
  if (looksLikeMetaplex(json)) return "metaplex-token-metadata";
  if (typeof json.mediaType === "string" && ("image" in json || "name" in json)) return "cip-25";
  return null;
}

function isCip68(json: Record<string, unknown>): boolean {
  if (json["constructor"] === 0 && Array.isArray(json.fields)) return true;
  const version = json.version;
  if (version !== 1 && version !== 2 && version !== 3 && version !== 4) return false;
  if (typeof json.mediaType === "string" || "image" in json) return true;
  return isRecord(json.metadata) && ("name" in json.metadata || "image" in json.metadata);
}

function hasFlowRoyalty(json: Record<string, unknown>): boolean {
  const list = Array.isArray(json.royalties)
    ? json.royalties
    : isRecord(json.royalties) && Array.isArray(json.royalties.cutInfos)
      ? json.royalties.cutInfos
      : null;
  if (!list) return false;
  return list.some((entry) => isRecord(entry) && "cut" in entry);
}

function isAptosProperties(json: Record<string, unknown>): boolean {
  const props = isRecord(json.properties)
    ? json.properties
    : isRecord(json.property_map)
      ? json.property_map
      : null;
  if (!props) return false;
  return Array.isArray(props.keys) && Array.isArray(props.values) && Array.isArray(props.types);
}
