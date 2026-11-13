import {
  fetchMetadataDocument,
  type ResolveOnChainArgs,
  type ResolvedAsset,
  type SolanaOnChain,
} from "@nft-lint/core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey, type PublicKey } from "@metaplex-foundation/umi";
import {
  fetchDigitalAsset,
  mplTokenMetadata,
  type DigitalAsset,
} from "@metaplex-foundation/mpl-token-metadata";
import { fetchAssetV1, mplCore, type AssetV1 } from "@metaplex-foundation/mpl-core";

export const TOKEN_METADATA_PROGRAM_ID = "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s";
export const CORE_PROGRAM_ID = "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d";

export function mapTokenMetadata(asset: DigitalAsset): SolanaOnChain {
  const metadata = asset.metadata;
  const creators = unwrapOption<Array<{ address: PublicKey; share: number; verified?: boolean }>>(
    metadata.creators,
  );
  return {
    kind: "metaplex-token-metadata",
    name: clean(metadata.name),
    symbol: clean(metadata.symbol),
    uri: clean(metadata.uri),
    sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
    ...(creators
      ? {
          creators: creators.map((creator) => ({
            address: creator.address.toString(),
            share: creator.share,
            ...(creator.verified !== undefined ? { verified: creator.verified } : {}),
          })),
        }
      : {}),
  };
}

export function mapCoreAsset(asset: AssetV1): SolanaOnChain {
  const creators = asset.royalties?.creators?.map((creator) => ({
    address: creator.address.toString(),
    share: creator.percentage,
  }));
  const attributes = asset.attributes?.attributeList?.map((attribute) => ({
    trait_type: attribute.key,
    value: attribute.value,
  }));
  return {
    kind: "metaplex-core",
    name: clean(asset.name),
    uri: clean(asset.uri),
    ...(asset.royalties ? { sellerFeeBasisPoints: asset.royalties.basisPoints } : {}),
    ...(creators ? { creators } : {}),
    ...(attributes ? { attributes } : {}),
  };
}

export async function resolveSolana(args: ResolveOnChainArgs): Promise<ResolvedAsset> {
  const rpc = args.config.rpc[args.chain.id]?.[0] ?? args.chain.rpc[0];
  if (!rpc) return { error: "No Solana RPC configured." };
  let address: PublicKey;
  try {
    address = publicKey(args.contract);
  } catch {
    return { error: `Solana address "${args.contract}" is not a valid public key.` };
  }
  const umi = createUmi(rpc).use(mplTokenMetadata()).use(mplCore());
  let account;
  try {
    account = await umi.rpc.getAccount(address);
  } catch (error) {
    return {
      error: `Solana RPC failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
  if (account.exists && account.owner.toString() === CORE_PROGRAM_ID) {
    const asset = await fetchAssetV1(umi, address);
    return finishSolana(mapCoreAsset(asset), args);
  }
  try {
    const asset = await fetchDigitalAsset(umi, address);
    return finishSolana(mapTokenMetadata(asset), args);
  } catch (tokenError) {
    try {
      const asset = await fetchAssetV1(umi, address);
      return finishSolana(mapCoreAsset(asset), args);
    } catch (coreError) {
      const tokenMessage = tokenError instanceof Error ? tokenError.message : String(tokenError);
      const coreMessage = coreError instanceof Error ? coreError.message : String(coreError);
      return {
        error: `Account ${args.contract} is not a Metaplex Token Metadata mint or Core asset. Token Metadata: ${tokenMessage}. Core: ${coreMessage}.`,
      };
    }
  }
}

async function finishSolana(
  onChain: SolanaOnChain,
  args: ResolveOnChainArgs,
): Promise<ResolvedAsset> {
  if (!onChain.uri) {
    return { onChain, standardHint: onChain.kind, error: "On-chain asset has an empty uri." };
  }
  try {
    const document = await fetchMetadataDocument(
      onChain.uri,
      args.network,
      args.config.ipfsGateways,
    );
    return {
      uri: onChain.uri,
      raw: document.raw,
      json: document.json,
      onChain,
      standardHint: onChain.kind,
    };
  } catch (error) {
    return {
      uri: onChain.uri,
      onChain,
      standardHint: onChain.kind,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function clean(value: string): string {
  return value.replaceAll("\0", "").trim();
}

function unwrapOption<T>(value: unknown): T | undefined {
  if (value == null) return undefined;
  if (typeof value === "object" && value && "__option" in value) {
    const option = value as { __option: string; value?: T };
    return option.__option === "Some" ? option.value : undefined;
  }
  return value as T;
}
