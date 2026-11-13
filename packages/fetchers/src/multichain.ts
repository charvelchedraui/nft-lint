import { createHash } from "node:crypto";
import {
  fetchMetadataDocument,
  isRecord,
  type JsonOnChain,
  type ResolveOnChainArgs,
  type ResolvedAsset,
  type StandardId,
} from "@nft-lint/core";
import { decodeAbiParameters, encodeFunctionData } from "viem";

type Args = ResolveOnChainArgs;

export async function resolveMultichain(args: Args): Promise<ResolvedAsset> {
  switch (args.chain.family) {
    case "tezos":
      return resolveTezos(args);
    case "bitcoin":
      return resolveBitcoin(args);
    case "ton":
      return resolveTon(args);
    case "flow":
      return resolveFlow(args);
    case "tron":
      return resolveTron(args);
    case "cardano":
      return resolveCardano(args);
    case "algorand":
      return resolveAlgorand(args);
    case "sui":
      return resolveSui(args);
    case "aptos":
      return resolveAptos(args);
    case "stargaze":
      return resolveStargaze(args);
    default:
      return { error: `No reader for ${args.chain.family}.` };
  }
}

function endpoint(args: Args): string {
  return args.config.rpc[args.chain.id]?.[0] ?? args.chain.rpc[0] ?? "";
}

async function getJson(args: Args, url: string): Promise<unknown> {
  const response = await args.network.fetch(url, { timeoutMs: args.config.timeoutMs });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}.`);
  }
  return JSON.parse(new TextDecoder().decode(response.body));
}

async function postJson(args: Args, url: string, body: unknown): Promise<unknown> {
  const response = await args.network.fetch(url, {
    timeoutMs: args.config.timeoutMs,
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${url} returned HTTP ${response.status}.`);
  }
  return JSON.parse(new TextDecoder().decode(response.body));
}

function documentFrom(value: unknown, standard: StandardId, onChain: JsonOnChain): ResolvedAsset {
  if (!isRecord(value) && !Array.isArray(value)) {
    return { onChain, standardHint: standard, error: "Reader did not return a JSON object." };
  }
  const raw = JSON.stringify(value);
  return { raw, json: value, onChain, standardHint: standard };
}

async function withRemote(
  args: Args,
  uri: string,
  standard: StandardId,
  onChain: JsonOnChain,
  base: ResolvedAsset,
): Promise<ResolvedAsset> {
  try {
    const document = await fetchMetadataDocument(uri, args.network, args.config.ipfsGateways);
    return {
      ...base,
      raw: document.raw,
      json: document.json,
      uri,
      onChain: { ...onChain, uri },
      standardHint: standard,
    };
  } catch (error) {
    return {
      ...base,
      uri,
      onChain,
      standardHint: standard,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function resolveTezos(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  const api = base.includes("api.tzkt.io") ? base : "https://api.tzkt.io";
  const url = `${api}/v1/tokens?contract=${encodeURIComponent(args.contract)}&tokenId=${encodeURIComponent(args.tokenId)}&limit=1`;
  try {
    const body = await getJson(args, url);
    const token = Array.isArray(body) ? body[0] : body;
    if (!isRecord(token)) return { error: "TzKT returned no token." };
    const metadata = token.metadata;
    const onChain: JsonOnChain = {
      kind: "tzip-21",
      name: typeof token.name === "string" ? token.name : undefined,
    };
    if (!isRecord(metadata)) return { onChain, error: "TzKT token has no metadata object." };
    return documentFrom(metadata, "tzip-21", onChain);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function resolveBitcoin(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  const id = args.contract;
  const url = `${base}/content/${id}`;
  try {
    const response = await args.network.fetch(url, { timeoutMs: args.config.timeoutMs });
    const contentType = response.headers["content-type"]?.split(";")[0]?.trim();
    const rawText = new TextDecoder().decode(response.body);
    const onChain: JsonOnChain = {
      kind: "ordinals",
      uri: url,
      ...(contentType ? { contentType } : {}),
    };
    if (!response.ok) return { onChain, error: `${url} returned HTTP ${response.status}.` };
    if (contentType?.includes("json") || rawText.trim().startsWith("{")) {
      try {
        return documentFrom(JSON.parse(rawText), "ordinals", onChain);
      } catch {
        return { onChain, raw: rawText, error: "Inscription content is not valid JSON." };
      }
    }
    return documentFrom(
      { inscription_id: id, ...(contentType ? { content_type: contentType } : {}) },
      "ordinals",
      onChain,
    );
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function resolveTon(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  const url = `${base}/v2/nfts/${encodeURIComponent(args.contract)}`;
  try {
    const body = await getJson(args, url);
    if (!isRecord(body)) return { error: "TON API did not return an NFT object." };
    const metadata = isRecord(body.metadata) ? body.metadata : body;
    const onChain: JsonOnChain = { kind: "tep-64" };
    return documentFrom(metadata, "tep-64", onChain);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

const FLOW_SCRIPT = `
import MetadataViews from 0x1d7e57aa55817448
import ViewResolver from 0x1d7e57aa55817448

access(all) fun main(owner: Address, id: UInt64): String {
  let account = getAccount(owner)
  let paths: [PublicPath] = [/public/collection, /public/NFTCollection, /public/nftCollection]
  var resolver: &{ViewResolver.Resolver}? = nil
  for path in paths {
    let cap = account.capabilities.get<&{ViewResolver.ResolverCollection}>(path)
    if cap.check() {
      if let collection = cap.borrow() {
        resolver = collection.borrowViewResolver(id: id)
        if resolver != nil { break }
      }
    }
  }
  if resolver == nil {
    return "{\\"error\\":\\"no MetadataViews resolver at the common public paths\\"}"
  }
  let display = MetadataViews.getDisplay(resolver!)!
  return "{\\"name\\":\\""
    .concat(display.name)
    .concat("\\",\\"description\\":\\"")
    .concat(display.description)
    .concat("\\",\\"thumbnail\\":\\"")
    .concat(display.thumbnail.uri())
    .concat("\\"}")
}
`.trim();

export async function resolveFlow(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  const address = args.contract.startsWith("0x") ? args.contract : `0x${args.contract}`;
  try {
    const body = await postJson(args, `${base}/v1/scripts`, {
      script: Buffer.from(FLOW_SCRIPT, "utf8").toString("base64"),
      arguments: [
        { type: "Address", value: address },
        { type: "UInt64", value: args.tokenId },
      ],
    });
    const value = isRecord(body) && typeof body.value === "string" ? body.value : null;
    if (!value) return { error: "Flow access node did not return a string." };
    const parsed = JSON.parse(value) as unknown;
    if (isRecord(parsed) && typeof parsed.error === "string") {
      return { error: parsed.error, onChain: { kind: "flow-metadata-views" } };
    }
    if (!isRecord(parsed)) return { error: "Flow script returned an unexpected document." };
    const json = {
      display: {
        name: parsed.name,
        description: parsed.description,
        thumbnail:
          typeof parsed.thumbnail === "string" ? { url: parsed.thumbnail } : parsed.thumbnail,
      },
    };
    return documentFrom(json, "flow-metadata-views", { kind: "flow-metadata-views" });
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function resolveTron(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  let tokenId: bigint;
  try {
    tokenId = BigInt(args.tokenId);
  } catch {
    return { error: `Token id "${args.tokenId}" is not an integer.` };
  }
  const data = encodeFunctionData({
    abi: [
      {
        type: "function",
        name: "tokenURI",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "string" }],
      },
    ],
    functionName: "tokenURI",
    args: [tokenId],
  });
  try {
    const body = await postJson(args, `${base}/wallet/triggerconstantcontract`, {
      owner_address: args.contract,
      contract_address: args.contract,
      function_selector: "tokenURI(uint256)",
      parameter: data.slice(10),
      visible: true,
    });
    if (
      !isRecord(body) ||
      !Array.isArray(body.constant_result) ||
      typeof body.constant_result[0] !== "string"
    ) {
      return { error: "Tron full node did not return tokenURI." };
    }
    const hex = body.constant_result[0].startsWith("0x")
      ? body.constant_result[0]
      : `0x${body.constant_result[0]}`;
    const decoded = decodeAbiParameters([{ type: "string" }], hex as `0x${string}`);
    const uri = decoded[0];
    if (typeof uri !== "string" || uri.trim() === "") {
      return { onChain: { kind: "trc-721" }, error: "tokenURI was empty." };
    }
    const fetched = await args.network.fetch(uri, { timeoutMs: args.config.timeoutMs });
    const contentType = fetched.headers["content-type"];
    const onChain: JsonOnChain = { kind: "trc-721", uri, ...(contentType ? { contentType } : {}) };
    const raw = new TextDecoder().decode(fetched.body);
    if (contentType?.includes("text/html") || raw.trim().startsWith("<")) {
      return {
        uri,
        raw,
        onChain,
        standardHint: "trc-721",
        error: "tokenURI returned HTML, not JSON.",
      };
    }
    try {
      return { uri, raw, json: JSON.parse(raw), onChain, standardHint: "trc-721" };
    } catch {
      return { uri, raw, onChain, error: "tokenURI did not return JSON." };
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function resolveCardano(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  const nameHex = /^[0-9a-fA-F]+$/.test(args.tokenId)
    ? args.tokenId.toLowerCase()
    : Buffer.from(args.tokenId, "utf8").toString("hex");
  try {
    const body = await postJson(args, `${base}/api/v1/asset_info`, {
      _asset_list: [[args.contract, nameHex]],
    });
    const row = Array.isArray(body) ? body[0] : body;
    if (!isRecord(row)) return { error: "Koios returned no asset." };
    const metadata = isRecord(row.minting_tx_metadata)
      ? row.minting_tx_metadata
      : isRecord(row.cip68_metadata)
        ? row.cip68_metadata
        : null;
    if (!metadata) return { error: "Koios asset has no minting metadata." };
    const standard: StandardId =
      "version" in metadata && !("721" in metadata) ? "cip-68" : "cip-25";
    return documentFrom(metadata, standard, { kind: standard === "cip-68" ? "cip-68" : "cip-25" });
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export function algorandReserveCid(template: string, reserve: string): string | null {
  const placeholder = template.match(/\{ipfscid:(\d+):([a-z0-9-]+):reserve:sha2-256\}/);
  if (!placeholder) return null;
  const version = placeholder[1];
  const codec = placeholder[2];
  const digest = decodeAlgorandAddress(reserve);
  if (!digest || digest.length !== 32) return null;
  if (version === "0" && codec === "dag-pb") return cidV0(digest);
  if (version === "1") return cidV1(digest, codec === "raw" ? 0x55 : 0x70);
  return null;
}

function decodeAlgorandAddress(address: string): Uint8Array | null {
  if (!/^[A-Z2-7]{58}$/.test(address)) return null;
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const char of address) {
    const value = alphabet.indexOf(char);
    if (value < 0) return null;
    bits += value.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8)
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  if (bytes.length < 36) return null;
  const pub = Buffer.from(bytes.slice(0, 32));
  const checksum = Buffer.from(bytes.slice(32, 36));
  const hash = createHash("sha512-256").update(pub).digest().subarray(28);
  if (!hash.equals(checksum)) return null;
  return pub;
}

function cidV0(digest: Uint8Array): string {
  const multihash = Buffer.concat([Buffer.from([0x12, 0x20]), Buffer.from(digest)]);
  return base58btc(multihash);
}

function cidV1(digest: Uint8Array, codec: number): string {
  const body = Buffer.concat([Buffer.from([0x01, codec, 0x12, 0x20]), Buffer.from(digest)]);
  return `b${base32(body)}`;
}

function base58btc(bytes: Buffer): string {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let n = 0n;
  for (const byte of bytes) n = n * 256n + BigInt(byte);
  let out = "";
  while (n > 0n) {
    out = alphabet[Number(n % 58n)] + out;
    n /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    out = `1${out}`;
  }
  return out;
}

function base32(bytes: Buffer): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let bits = "";
  for (const byte of bytes) bits += byte.toString(2).padStart(8, "0");
  let out = "";
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += alphabet[Number.parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

export async function resolveAlgorand(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  try {
    const body = await getJson(args, `${base}/v2/assets/${encodeURIComponent(args.contract)}`);
    if (!isRecord(body) || !isRecord(body.asset) || !isRecord(body.asset.params)) {
      return { error: "Algod did not return asset params." };
    }
    const params = body.asset.params;
    const url = typeof params.url === "string" ? params.url : "";
    if (url.includes("template-ipfs://") || url.includes("{ipfscid:")) {
      const reserve = typeof params.reserve === "string" ? params.reserve : "";
      const cid = algorandReserveCid(url, reserve);
      const onChain: JsonOnChain = { kind: "arc-19", uri: url };
      if (!cid) {
        return {
          onChain,
          standardHint: "arc-19",
          json: { url, asset_name: params.name, unit_name: params["unit-name"] },
          error: "ARC-19 reserve address did not decode to a CID.",
        };
      }
      const gateway = args.config.ipfsGateways[0] ?? "https://ipfs.io/ipfs/";
      return withRemote(args, `${gateway}${cid}`, "arc-19", onChain, {
        onChain,
        standardHint: "arc-19",
      });
    }
    if (url.startsWith("ipfs://") || url.startsWith("https://") || url.startsWith("http://")) {
      return withRemote(args, url, "arc-3", { kind: "arc-3", uri: url }, { standardHint: "arc-3" });
    }
    const indexer = base.replace("://mainnet-api.", "://mainnet-idx.");
    const notes = await getJson(
      args,
      `${indexer}/v2/assets/${encodeURIComponent(args.contract)}/transactions?tx-type=acfg`,
    );
    const txns = isRecord(notes) && Array.isArray(notes.transactions) ? notes.transactions : [];
    for (const txn of txns) {
      if (!isRecord(txn) || typeof txn.note !== "string") continue;
      const text = Buffer.from(txn.note, "base64").toString("utf8");
      if (!text.includes("arc69")) continue;
      return documentFrom(JSON.parse(text), "arc-69", { kind: "arc-69" });
    }
    return { error: "Asset has no ARC-3 URL and no ARC-69 note." };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function resolveSui(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  try {
    const body = await postJson(args, base, {
      jsonrpc: "2.0",
      id: 1,
      method: "sui_getObject",
      params: [
        args.contract,
        { showType: true, showOwner: true, showDisplay: true, showContent: true },
      ],
    });
    const data =
      isRecord(body) && isRecord(body.result) && isRecord(body.result.data)
        ? body.result.data
        : null;
    const display =
      data && isRecord(data.display) && isRecord(data.display.data) ? data.display.data : null;
    if (!display)
      return {
        error: "Sui object has no Display data. The type may not have a Display registered.",
      };
    const owner = data && isRecord(data.owner) ? data.owner : null;
    const json = {
      ...display,
      ...(owner && typeof owner.ObjectOwner === "string" ? { owner } : {}),
    };
    return documentFrom(json, "sui-display", { kind: "sui-display" });
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function resolveAptos(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  const account = args.contract;
  try {
    const token = await getJson(
      args,
      `${base}/accounts/${account}/resource/${encodeURIComponent("0x4::token::Token")}`,
    );
    if (!isRecord(token) || !isRecord(token.data))
      return { error: "Aptos token resource was empty." };
    const data = token.data;
    let properties: unknown;
    try {
      const map = await getJson(
        args,
        `${base}/accounts/${account}/resource/${encodeURIComponent("0x4::property_map::PropertyMap")}`,
      );
      properties = normalizePropertyMap(map);
    } catch {
      properties = undefined;
    }
    const json: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      uri: data.uri,
    };
    if (properties) json.properties = properties;
    const onChain: JsonOnChain = {
      kind: "aptos-digital-asset",
      ...(typeof data.uri === "string" ? { uri: data.uri } : {}),
      ...(typeof data.name === "string" ? { name: data.name } : {}),
    };
    if (typeof data.uri === "string" && data.uri.trim() !== "") {
      const remote = await withRemote(args, data.uri, "aptos-digital-asset", onChain, {
        json,
        onChain,
        standardHint: "aptos-digital-asset",
      });
      if (isRecord(remote.json)) {
        remote.json = { ...json, ...remote.json, uri: data.uri };
      }
      return remote;
    }
    return documentFrom(json, "aptos-digital-asset", onChain);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function normalizePropertyMap(
  value: unknown,
): { keys: string[]; values: string[]; types: string[] } | undefined {
  if (!isRecord(value) || !isRecord(value.data)) return undefined;
  const inner = isRecord(value.data.inner) ? value.data.inner : value.data;
  const rows = Array.isArray(inner.data) ? inner.data : [];
  const keys: string[] = [];
  const values: string[] = [];
  const types: string[] = [];
  for (const row of rows) {
    if (!isRecord(row) || typeof row.key !== "string" || !isRecord(row.value)) continue;
    keys.push(row.key);
    types.push(typeof row.value.type === "string" ? row.value.type : "");
    values.push(typeof row.value.value === "string" ? row.value.value : "");
  }
  if (keys.length === 0) return undefined;
  return { keys, values, types };
}

export async function resolveStargaze(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  const query = Buffer.from(
    JSON.stringify({ nft_info: { token_id: args.tokenId } }),
    "utf8",
  ).toString("base64");
  try {
    const body = await getJson(
      args,
      `${base}/cosmwasm/wasm/v1/contract/${args.contract}/smart/${encodeURIComponent(query)}`,
    );
    const data = isRecord(body) && isRecord(body.data) ? body.data : body;
    if (!isRecord(data)) return { error: "Stargaze LCD did not return nft_info." };
    const json: Record<string, unknown> = { ...data };
    try {
      const royaltyQuery = Buffer.from(
        JSON.stringify({ extension: { msg: { royalty_info: {} } } }),
        "utf8",
      ).toString("base64");
      const royalty = await getJson(
        args,
        `${base}/cosmwasm/wasm/v1/contract/${args.contract}/smart/${encodeURIComponent(royaltyQuery)}`,
      );
      const royaltyData = isRecord(royalty) && isRecord(royalty.data) ? royalty.data : royalty;
      if (isRecord(royaltyData) && isRecord(royaltyData.royalty_info)) {
        json.royalty_info = royaltyData.royalty_info;
      }
    } catch {
      // Royalty is a collection extension. A contract without it still has nft_info.
    }
    const onChain: JsonOnChain = {
      kind: "cw721",
      ...(typeof data.token_uri === "string" ? { uri: data.token_uri } : {}),
    };
    if (typeof data.token_uri === "string" && data.token_uri.startsWith("ipfs://")) {
      const remote = await withRemote(args, data.token_uri, "cw721", onChain, {
        json,
        onChain,
        standardHint: "cw721",
      });
      if (isRecord(remote.json)) remote.json = { ...json, ...remote.json };
      return remote;
    }
    return documentFrom(json, "cw721", onChain);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}
