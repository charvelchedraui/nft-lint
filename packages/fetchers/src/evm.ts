import {
  fetchMetadataDocument,
  inspectErc1155Uri,
  type ErcOnChain,
  type ResolveOnChainArgs,
  type ResolvedAsset,
  type StandardId,
} from "@nft-lint/core";
import { createPublicClient, fallback, http, type Abi, type PublicClient } from "viem";

export const ERC721_INTERFACE = "0x80ac58cd";
export const ERC1155_INTERFACE = "0xd9b67a26";
export const ERC2981_INTERFACE = "0x2a55205a";

const sharedAbi = [
  {
    type: "function",
    name: "supportsInterface",
    stateMutability: "view",
    inputs: [{ name: "interfaceId", type: "bytes4" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "contractURI",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "royaltyInfo",
    stateMutability: "view",
    inputs: [
      { name: "tokenId", type: "uint256" },
      { name: "salePrice", type: "uint256" },
    ],
    outputs: [
      { name: "receiver", type: "address" },
      { name: "royaltyAmount", type: "uint256" },
    ],
  },
] as const;

export const erc721Abi = [
  ...sharedAbi,
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const satisfies Abi;

export const erc1155Abi = [
  ...sharedAbi,
  {
    type: "function",
    name: "uri",
    stateMutability: "view",
    inputs: [{ name: "id", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
] as const satisfies Abi;

export interface EvmReader {
  supportsInterface(interfaceId: `0x${string}`): Promise<boolean>;
  tokenUri(tokenId: bigint): Promise<string>;
  uri(tokenId: bigint): Promise<string>;
  contractUri(): Promise<string>;
  royaltyInfo(tokenId: bigint, salePrice: bigint): Promise<{ receiver: string; amount: bigint }>;
}

export function createViemReader(
  rpcUrls: string[],
  contract: `0x${string}`,
  timeoutMs: number,
): EvmReader {
  const client = createPublicClient({
    transport: fallback(rpcUrls.map((url) => http(url, { timeout: timeoutMs }))),
  }) as PublicClient;
  return {
    supportsInterface: (interfaceId) =>
      client.readContract({
        address: contract,
        abi: erc721Abi,
        functionName: "supportsInterface",
        args: [interfaceId],
      }),
    tokenUri: (tokenId) =>
      client.readContract({
        address: contract,
        abi: erc721Abi,
        functionName: "tokenURI",
        args: [tokenId],
      }),
    uri: (tokenId) =>
      client.readContract({
        address: contract,
        abi: erc1155Abi,
        functionName: "uri",
        args: [tokenId],
      }),
    contractUri: () =>
      client.readContract({
        address: contract,
        abi: erc721Abi,
        functionName: "contractURI",
      }),
    async royaltyInfo(tokenId, salePrice) {
      const [receiver, amount] = await client.readContract({
        address: contract,
        abi: erc721Abi,
        functionName: "royaltyInfo",
        args: [tokenId, salePrice],
      });
      return { receiver, amount };
    },
  };
}

export async function readEvmNft(reader: EvmReader, tokenId: bigint): Promise<ErcOnChain> {
  const onChain: ErcOnChain = { kind: "erc-721" };
  try {
    onChain.supportsErc721 = await reader.supportsInterface(ERC721_INTERFACE);
    onChain.supportsErc1155 = await reader.supportsInterface(ERC1155_INTERFACE);
    onChain.supports2981 = await reader.supportsInterface(ERC2981_INTERFACE);
  } catch (error) {
    onChain.readError = messageOf(error);
  }
  if (onChain.supportsErc1155 && !onChain.supportsErc721) onChain.kind = "erc-1155";
  try {
    if (onChain.kind === "erc-1155") onChain.tokenUri = await reader.uri(tokenId);
    else {
      try {
        onChain.tokenUri = await reader.tokenUri(tokenId);
      } catch {
        onChain.tokenUri = await reader.uri(tokenId);
        onChain.kind = "erc-1155";
      }
    }
  } catch (error) {
    onChain.readError = onChain.readError ?? messageOf(error);
  }
  try {
    onChain.contractUri = await reader.contractUri();
  } catch {
    onChain.contractUri = undefined;
  }
  if (onChain.supports2981) {
    try {
      const royalty = await reader.royaltyInfo(tokenId, 10_000n);
      onChain.royalty = {
        receiver: royalty.receiver,
        salePrice: "10000",
        amount: royalty.amount.toString(),
      };
    } catch (error) {
      onChain.readError = onChain.readError ?? messageOf(error);
    }
  }
  return onChain;
}

export async function resolveEvm(args: ResolveOnChainArgs): Promise<ResolvedAsset> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(args.contract)) {
    return { error: `Contract "${args.contract}" is not a 20-byte hex address.` };
  }
  let tokenId: bigint;
  try {
    tokenId = BigInt(args.tokenId);
  } catch {
    return { error: `Token id "${args.tokenId}" is not an integer.` };
  }
  if (tokenId < 0n) return { error: `Token id "${args.tokenId}" is negative.` };
  const rpc = args.config.rpc[args.chain.id] ?? args.chain.rpc;
  if (rpc.length === 0) return { error: `No RPC configured for ${args.chain.id}.` };
  try {
    const onChain = await readEvmNft(
      createViemReader(rpc, args.contract as `0x${string}`, args.config.timeoutMs),
      tokenId,
    );
    return finishEvm(onChain, args, tokenId);
  } catch (error) {
    return { error: `RPC read failed for ${args.chain.name}: ${messageOf(error)}` };
  }
}

async function finishEvm(
  onChain: ErcOnChain,
  args: ResolveOnChainArgs,
  tokenId: bigint,
): Promise<ResolvedAsset> {
  const standardHint: StandardId = onChain.kind;
  let uri = onChain.tokenUri;
  if (uri && onChain.kind === "erc-1155") {
    const substituted = inspectErc1155Uri(uri, tokenId.toString());
    if (substituted.substituted) uri = substituted.substituted;
  }
  if (onChain.contractUri) {
    try {
      const document = await fetchMetadataDocument(
        onChain.contractUri,
        args.network,
        args.config.ipfsGateways,
      );
      onChain.contractMetadata = document.json;
    } catch {
      onChain.contractMetadata = undefined;
    }
  }
  if (!uri) {
    return {
      onChain,
      standardHint,
      error: onChain.readError
        ? `Could not read token URI: ${onChain.readError}`
        : "The contract did not return a tokenURI or uri.",
    };
  }
  try {
    const document = await fetchMetadataDocument(uri, args.network, args.config.ipfsGateways);
    return {
      uri: onChain.tokenUri,
      raw: document.raw,
      json: document.json,
      onChain,
      standardHint,
    };
  } catch (error) {
    return {
      uri: onChain.tokenUri,
      onChain,
      standardHint,
      error: messageOf(error),
    };
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
