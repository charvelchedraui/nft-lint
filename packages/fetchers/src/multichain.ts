import { createHash } from "node:crypto";
import {
  fetchMetadataDocument,
  isRecord,
  type JsonOnChain,
  type ResolveOnChainArgs,
  type ResolvedAsset,
  type StandardId,
} from "@nft-lint/core";
import { CID } from "multiformats/cid";
import { create as createDigest } from "multiformats/hashes/digest";
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
  return endpoints(args)[0] ?? "";
}

function endpoints(args: Args, extras: string[] = []): string[] {
  const configured = args.config.rpc[args.chain.id] ?? args.chain.rpc;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of [...configured, ...extras]) {
    const base = value.replace(/\/$/, "");
    if (!base || seen.has(base)) continue;
    seen.add(base);
    out.push(base);
  }
  return out;
}

function keepAsset(asset: ResolvedAsset): boolean {
  if (!asset.error) return true;
  if (asset.json !== undefined || asset.uri || asset.raw) return true;
  return !transportFailure(asset.error);
}

function transportFailure(message: string): boolean {
  return /HTTP (?:403|408|425|429|5\d\d)|timeout|timed out|fetch failed|network|ENOTFOUND|ECONN|EAI_AGAIN|aborted|empty body|returned HTML\.|socket|getaddrinfo/i.test(
    message,
  );
}

async function readBodyJson(
  response: {
    ok: boolean;
    status: number;
    body: Uint8Array;
  },
  url: string,
): Promise<unknown> {
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}.`);
  const text = new TextDecoder().decode(response.body).trim();
  if (!text) throw new Error(`${url} returned an empty body.`);
  if (text.startsWith("<")) throw new Error(`${url} returned HTML.`);
  return JSON.parse(text);
}

async function getJson(args: Args, url: string): Promise<unknown> {
  const response = await args.network.fetch(url, { timeoutMs: args.config.timeoutMs });
  return readBodyJson(response, url);
}

async function postJson(args: Args, url: string, body: unknown): Promise<unknown> {
  const response = await args.network.fetch(url, {
    timeoutMs: args.config.timeoutMs,
    method: "POST",
    body: JSON.stringify(body),
  });
  return readBodyJson(response, url);
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

const ORDINAL_HOSTS = ["https://turbo.ordinalswallet.com", "https://ordinals.com"];

export async function resolveBitcoin(args: Args): Promise<ResolvedAsset> {
  const id = args.contract;
  const bases = endpoints(args, ORDINAL_HOSTS);
  const errors: string[] = [];
  for (const base of bases) {
    const inscriptionUrl = `${base}/inscription/${id}`;
    try {
      const response = await args.network.fetch(inscriptionUrl, {
        timeoutMs: args.config.timeoutMs,
      });
      const rawText = new TextDecoder().decode(response.body);
      if (!response.ok || rawText.trim().startsWith("<")) {
        errors.push(`${inscriptionUrl} returned HTTP ${response.status}.`);
        continue;
      }
      const info = JSON.parse(rawText) as unknown;
      if (!isRecord(info)) {
        errors.push(`${inscriptionUrl} did not return an inscription object.`);
        continue;
      }
      const contentType = typeof info.content_type === "string" ? info.content_type : undefined;
      const document = ordinalsDocument(info, id);
      const onChain: JsonOnChain = {
        kind: "ordinals",
        uri: inscriptionUrl,
        ...(contentType ? { contentType } : {}),
      };
      if (contentType?.includes("json")) {
        const content = await args.network.fetch(`${base}/content/${id}`, {
          timeoutMs: args.config.timeoutMs,
        });
        const contentText = new TextDecoder().decode(content.body);
        if (content.ok && contentText.trim().startsWith("{")) {
          const parsed = JSON.parse(contentText) as unknown;
          if (isRecord(parsed)) {
            return documentFrom(
              { ...document, ...parsed, inscription_id: id },
              "ordinals",
              onChain,
            );
          }
        }
      }
      return documentFrom(document, "ordinals", onChain);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { error: errors.at(-1) ?? "No Ordinals endpoint returned this inscription." };
}

function ordinalsDocument(info: Record<string, unknown>, id: string): Record<string, unknown> {
  const collection = isRecord(info.collection) ? info.collection : null;
  const properties = isRecord(info.properties) ? info.properties : null;
  const attributes = isRecord(properties?.attributes) ? properties.attributes : null;
  const traits = isRecord(attributes?.traits) ? attributes.traits : null;
  const traitList = traits
    ? Object.entries(traits)
        .filter((entry): entry is [string, string | number] => {
          const value = entry[1];
          return typeof value === "string" || typeof value === "number";
        })
        .map(([trait_type, value]) => ({ trait_type, value }))
    : [];
  const title = typeof attributes?.title === "string" ? attributes.title.trim() : "";
  const collectionName =
    collection && typeof collection.name === "string" ? collection.name.trim() : "";
  const icon =
    (typeof collection?.icon_inscription === "string" && collection.icon_inscription) ||
    (typeof collection?.inscription_icon === "string" && collection.inscription_icon) ||
    "";
  return {
    name: title || collectionName || id,
    description: typeof collection?.description === "string" ? collection.description : "",
    inscription_id: id,
    ...(typeof info.content_type === "string" ? { content_type: info.content_type } : {}),
    ...(typeof info.content_length === "number" ? { content_length: info.content_length } : {}),
    ...(Array.isArray(info.parents) ? { parents: info.parents } : {}),
    ...(typeof info.delegate === "string" ? { delegate: info.delegate } : {}),
    ...(collection && typeof collection.slug === "string" && collection.slug
      ? { slug: collection.slug }
      : {}),
    ...(icon ? { icon_inscription: icon } : {}),
    ...(traitList.length > 0 ? { attributes: traitList } : {}),
  };
}

export async function resolveTon(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  const url = `${base}/v2/nfts/${encodeURIComponent(args.contract)}`;
  try {
    const body = await getJson(args, url);
    if (!isRecord(body)) return { error: "TON API did not return an NFT object." };
    const metadata = isRecord(body.metadata) ? { ...body.metadata } : { ...body };
    const targets = [args.contract];
    if (isRecord(body.collection) && typeof body.collection.address === "string") {
      targets.push(body.collection.address);
    }
    for (const account of targets) {
      try {
        const royalty = await getJson(
          args,
          `${base}/v2/blockchain/accounts/${encodeURIComponent(account)}/methods/royalty_params`,
        );
        if (isRecord(royalty) && royalty.success === true && isRecord(royalty.decoded)) {
          metadata.royalty_params = royalty.decoded;
          break;
        }
      } catch {
        // The item or the collection may not implement royalty_params.
      }
    }
    const onChain: JsonOnChain = { kind: "tep-64" };
    return documentFrom(metadata, "tep-64", onChain);
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

const FLOW_SCRIPT = `
import MetadataViews from 0x1d7e57aa55817448
import ViewResolver from 0x1d7e57aa55817448

access(all) fun main(owner: Address, id: UInt64): MetadataViews.Display {
  let account = getAccount(owner)
  let paths: [PublicPath] = [
    /public/MomentCollection,
    /public/collection,
    /public/NFTCollection,
    /public/nftCollection,
    /public/AllDayNFTCollection
  ]
  for path in paths {
    let cap = account.capabilities.get<&{ViewResolver.ResolverCollection}>(path)
    if !cap.check() { continue }
    if let collection = cap.borrow() {
      if let resolver = collection.borrowViewResolver(id: id) {
        if let display = MetadataViews.getDisplay(resolver) {
          return display
        }
      }
    }
  }
  panic("no MetadataViews Display for this id on the common public paths")
}
`.trim();

export async function resolveFlow(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  const address = args.contract.startsWith("0x") ? args.contract : `0x${args.contract}`;
  try {
    const response = await args.network.fetch(`${base}/v1/scripts`, {
      timeoutMs: args.config.timeoutMs,
      method: "POST",
      body: JSON.stringify({
        script: Buffer.from(FLOW_SCRIPT, "utf8").toString("base64"),
        arguments: [flowArg("Address", address), flowArg("UInt64", args.tokenId)],
      }),
    });
    const raw = new TextDecoder().decode(response.body);
    const parsed = parseFlowBody(raw);
    if (!response.ok) {
      const message = isRecord(parsed) && typeof parsed.message === "string" ? parsed.message : raw;
      return { error: message.slice(0, 500) };
    }
    const display = flowDisplay(parsed);
    if (!display) return { error: "Flow access node did not return a Display view." };
    return documentFrom({ display }, "flow-metadata-views", { kind: "flow-metadata-views" });
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function flowArg(type: string, value: string): string {
  return Buffer.from(JSON.stringify({ type, value }), "utf8").toString("base64");
}

function parseFlowBody(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return JSON.parse(trimmed);
  const decoded = Buffer.from(trimmed, "base64").toString("utf8");
  return JSON.parse(decoded);
}

function flowDisplay(value: unknown): Record<string, unknown> | null {
  const root = isRecord(value) && "value" in value ? value.value : value;
  if (!isRecord(root) || !Array.isArray(root.fields)) return null;
  const fields = new Map<string, unknown>();
  for (const field of root.fields) {
    if (isRecord(field) && typeof field.name === "string") fields.set(field.name, field.value);
  }
  const name = flowString(fields.get("name"));
  const description = flowString(fields.get("description"));
  const thumbnail = flowFile(fields.get("thumbnail"));
  if (!name && !thumbnail) return null;
  return {
    name: name ?? "",
    description: description ?? "",
    ...(thumbnail ? { thumbnail } : {}),
  };
}

function flowString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (isRecord(value) && typeof value.value === "string") return value.value;
  return null;
}

function flowFile(value: unknown): Record<string, string> | null {
  if (!isRecord(value)) return null;
  const inner = isRecord(value.value) ? value.value : value;
  if (!isRecord(inner) || !Array.isArray(inner.fields)) {
    const url = flowString(value);
    return url ? { url } : null;
  }
  const fields = new Map<string, string>();
  for (const field of inner.fields) {
    if (!isRecord(field) || typeof field.name !== "string") continue;
    const text = flowString(field.value);
    if (text) fields.set(field.name, text);
  }
  if (fields.get("url")) return { url: fields.get("url")! };
  if (fields.get("cid")) {
    return {
      cid: fields.get("cid")!,
      ...(fields.get("path") ? { path: fields.get("path")! } : {}),
    };
  }
  return null;
}

export async function resolveTron(args: Args): Promise<ResolvedAsset> {
  const errors: string[] = [];
  for (const base of endpoints(args)) {
    const asset = await readTron(args, base);
    if (keepAsset(asset)) return asset;
    if (asset.error) errors.push(asset.error);
  }
  return { error: errors.at(-1) ?? "No Tron full node returned tokenURI." };
}

async function readTron(args: Args, base: string): Promise<ResolvedAsset> {
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
    if (isRecord(row.cip68_metadata)) {
      const decoded = decodeCip68(row.cip68_metadata);
      if (decoded) return documentFrom(decoded, "cip-68", { kind: "cip-68" });
    }
    const metadata = isRecord(row.minting_tx_metadata) ? row.minting_tx_metadata : null;
    if (!metadata) return { error: "Koios asset has no minting metadata." };
    const standard: StandardId = "721" in metadata || "777" in metadata ? "cip-25" : "cip-68";
    return documentFrom(metadata, standard, { kind: standard === "cip-68" ? "cip-68" : "cip-25" });
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

const ARC19_CODECS: Record<string, number> = {
  raw: 0x55,
  "dag-pb": 0x70,
};

export function algorandReserveCid(template: string, reserve: string): string | null {
  const placeholder = template
    .split("#")[0]
    ?.split("?")[0]
    ?.match(/\{ipfscid:(\d+):([a-z0-9-]+):reserve:sha2-256\}/);
  if (!placeholder) return null;
  const version = placeholder[1];
  const codecName = placeholder[2] ?? "";
  const codec = ARC19_CODECS[codecName];
  const digest = decodeAlgorandAddress(reserve);
  if (codec === undefined || !digest || digest.length !== 32) return null;
  const bytes = new Uint8Array(digest.byteLength);
  bytes.set(digest);
  const multihash = createDigest(0x12, bytes);
  if (version === "0") {
    if (codec !== 0x70) return null;
    return CID.create(0, 0x70, multihash).toString();
  }
  if (version === "1") return CID.create(1, codec, multihash).toString();
  return null;
}

export function algorandTemplatePath(template: string): string {
  const match = template.split("#")[0]?.match(/\{ipfscid:[^}]+\}\/?([^?]*)/);
  const path = match?.[1]?.replace(/^\//, "") ?? "";
  return path;
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

export async function resolveAlgorand(args: Args): Promise<ResolvedAsset> {
  const errors: string[] = [];
  for (const base of endpoints(args)) {
    const asset = await readAlgorand(args, base);
    if (keepAsset(asset)) return asset;
    if (asset.error) errors.push(asset.error);
  }
  return { error: errors.at(-1) ?? "No Algorand API returned this asset." };
}

async function readAlgorand(args: Args, base: string): Promise<ResolvedAsset> {
  try {
    const body = await getJson(args, `${base}/v2/assets/${encodeURIComponent(args.contract)}`);
    const asset = isRecord(body) && isRecord(body.asset) ? body.asset : body;
    if (!isRecord(asset) || !isRecord(asset.params)) {
      return { error: "Algod did not return asset params." };
    }
    const params = asset.params;
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
      const path = algorandTemplatePath(url);
      const uri = path ? `ipfs://${cid}/${path}` : `ipfs://${cid}`;
      return withRemote(args, uri, "arc-19", onChain, {
        json: { url, name: params.name, unit_name: params["unit-name"] },
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

const SUI_GRAPHQL = ["https://graphql.mainnet.sui.io/graphql"];

export async function resolveSui(args: Args): Promise<ResolvedAsset> {
  const hosts = endpoints(args, SUI_GRAPHQL).filter(
    (host) => host.includes("graphql") || host.endsWith("/graphql"),
  );
  const targets = hosts.length > 0 ? hosts : SUI_GRAPHQL;
  const query = `query ($address: SuiAddress!) {
    object(address: $address) {
      asMoveObject { contents { display { output errors } } }
      owner { __typename ... on AddressOwner { address { address } } ... on ObjectOwner { address { address } } }
    }
  }`;
  const errors: string[] = [];
  for (const host of targets) {
    try {
      const body = await postJson(args, host, { query, variables: { address: args.contract } });
      const object =
        isRecord(body) && isRecord(body.data) && isRecord(body.data.object)
          ? body.data.object
          : null;
      const contents =
        object && isRecord(object.asMoveObject) && isRecord(object.asMoveObject.contents)
          ? object.asMoveObject.contents
          : null;
      const display = contents && isRecord(contents.display) ? contents.display : null;
      const output = display && isRecord(display.output) ? display.output : null;
      if (!output) {
        const message =
          isRecord(body) && Array.isArray(body.errors)
            ? JSON.stringify(body.errors).slice(0, 300)
            : "Sui object has no Display output.";
        errors.push(message);
        continue;
      }
      const owner = object && isRecord(object.owner) ? object.owner : null;
      const ownerAddress = suiOwnerAddress(owner);
      const json = {
        ...output,
        ...(owner && owner.__typename === "ObjectOwner" && ownerAddress
          ? { owner: { ObjectOwner: ownerAddress } }
          : {}),
      };
      return documentFrom(json, "sui-display", { kind: "sui-display" });
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { error: errors.at(-1) ?? "No Sui GraphQL endpoint returned Display data." };
}

function suiOwnerAddress(owner: Record<string, unknown> | null): string | undefined {
  if (!owner) return undefined;
  if (typeof owner.address === "string") return owner.address;
  if (isRecord(owner.address) && typeof owner.address.address === "string")
    return owner.address.address;
  return undefined;
}

function decodeCip68(datum: Record<string, unknown>): Record<string, unknown> | null {
  const root = Object.values(datum).find((value) => isRecord(value) && Array.isArray(value.fields));
  if (!isRecord(root) || !Array.isArray(root.fields)) return null;
  const mapField = root.fields.find((field) => isRecord(field) && Array.isArray(field.map));
  const versionField = root.fields.find(
    (field) => isRecord(field) && typeof field.int === "number",
  );
  if (!isRecord(mapField) || !Array.isArray(mapField.map)) return null;
  const json: Record<string, unknown> = {};
  if (isRecord(versionField) && typeof versionField.int === "number")
    json.version = versionField.int;
  for (const entry of mapField.map) {
    if (!isRecord(entry) || !isRecord(entry.k)) continue;
    const key = plutusText(entry.k);
    if (!key) continue;
    json[key] = plutusValue(entry.v);
  }
  return json;
}

function plutusText(value: Record<string, unknown>): string | null {
  if (typeof value.bytes !== "string") return null;
  try {
    return Buffer.from(value.bytes, "hex").toString("utf8");
  } catch {
    return null;
  }
}

function plutusValue(value: unknown): unknown {
  if (!isRecord(value)) return value;
  if (typeof value.bytes === "string") return plutusText(value) ?? value.bytes;
  if (typeof value.int === "number") return value.int;
  if (Array.isArray(value.list)) return value.list.map((item) => plutusValue(item));
  if (Array.isArray(value.map)) {
    const out: Record<string, unknown> = {};
    for (const entry of value.map) {
      if (!isRecord(entry) || !isRecord(entry.k)) continue;
      const key = plutusText(entry.k);
      if (key) out[key] = plutusValue(entry.v);
    }
    return out;
  }
  return value;
}

export async function resolveAptos(args: Args): Promise<ResolvedAsset> {
  const base = endpoint(args).replace(/\/$/, "");
  if (args.contract.includes("::")) return resolveAptosV1(args, base);
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

async function resolveAptosV1(args: Args, base: string): Promise<ResolvedAsset> {
  const parts = args.contract.split("::");
  if (parts.length < 3) {
    return { error: "Token v1 target must be creator::collection::token name." };
  }
  const creator = parts[0] ?? "";
  const collection = parts[1] ?? "";
  const name = parts.slice(2).join("::");
  try {
    const stored = await getJson(
      args,
      `${base}/accounts/${creator}/resource/${encodeURIComponent("0x3::token::Collections")}`,
    );
    const handle =
      isRecord(stored) && isRecord(stored.data) && isRecord(stored.data.token_data)
        ? stored.data.token_data.handle
        : undefined;
    if (typeof handle !== "string") return { error: "Creator has no token v1 Collections table." };
    const data = await postJson(args, `${base}/tables/${handle}/item`, {
      key_type: "0x3::token::TokenDataId",
      value_type: "0x3::token::TokenData",
      key: { creator, collection, name },
    });
    if (!isRecord(data)) return { error: "Token v1 data was empty." };
    const royalty = isRecord(data.royalty) ? data.royalty : null;
    const json: Record<string, unknown> = {
      name: data.name,
      description: data.description,
      uri: data.uri,
      collection: { name: collection, uri: data.uri, description: data.description },
      ...(royalty
        ? {
            royalty: {
              numerator: royalty.royalty_points_numerator,
              denominator: royalty.royalty_points_denominator,
              payee_address: royalty.payee_address,
            },
          }
        : {}),
    };
    const onChain: JsonOnChain = {
      kind: "aptos-digital-asset",
      ...(typeof data.uri === "string" ? { uri: data.uri } : {}),
      ...(typeof data.name === "string" ? { name: data.name } : {}),
    };
    if (typeof data.uri === "string" && data.uri.trim() !== "" && !data.uri.startsWith("Token ")) {
      const remote = await withRemote(args, data.uri, "aptos-digital-asset", onChain, {
        json,
        onChain,
        standardHint: "aptos-digital-asset",
      });
      if (isRecord(remote.json)) remote.json = { ...json, ...remote.json, uri: data.uri };
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

const STARGAZE_REST = [
  "https://cosmos-rest.publicnode.com",
  "https://hub-rest.stargaze-apis.com",
  "https://rest.cosmos.directory/cosmoshub",
  "https://lcd-cosmoshub.keplr.app",
];

export async function resolveStargaze(args: Args): Promise<ResolvedAsset> {
  const query = Buffer.from(
    JSON.stringify({ nft_info: { token_id: args.tokenId } }),
    "utf8",
  ).toString("base64");
  const errors: string[] = [];
  for (const base of endpoints(args, STARGAZE_REST)) {
    try {
      return await readStargaze(args, base, query);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  return { error: errors.at(-1) ?? "No Stargaze LCD returned nft_info." };
}

async function readStargaze(args: Args, base: string, query: string): Promise<ResolvedAsset> {
  const body = await getJson(
    args,
    `${base}/cosmwasm/wasm/v1/contract/${args.contract}/smart/${encodeURIComponent(query)}`,
  );
  const data = isRecord(body) && isRecord(body.data) ? body.data : body;
  if (!isRecord(data)) throw new Error("Stargaze LCD did not return nft_info.");
  const json: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== null && value !== undefined) json[key] = value;
  }
  try {
    const infoQuery = Buffer.from(JSON.stringify({ contract_info: {} }), "utf8").toString("base64");
    const info = await getJson(
      args,
      `${base}/cosmwasm/wasm/v1/contract/${args.contract}/smart/${encodeURIComponent(infoQuery)}`,
    );
    const infoData = isRecord(info) && isRecord(info.data) ? info.data : info;
    if (isRecord(infoData)) {
      const collection = isRecord(infoData.extension) ? infoData.extension : null;
      const tokenExtension = isRecord(json.extension) ? json.extension : null;
      if (collection || tokenExtension) {
        json.extension = { ...(collection ?? {}), ...(tokenExtension ?? {}) };
      }
      if (!isRecord(json.royalty_info) && collection && isRecord(collection.royalty_info)) {
        json.royalty_info = collection.royalty_info;
      }
      if (typeof json.name !== "string" && typeof infoData.name === "string")
        json.name = infoData.name;
    }
  } catch {
    // Collection info is optional. nft_info can stand on its own.
  }
  if (typeof json.name !== "string" && args.tokenId.trim() !== "") json.name = args.tokenId;
  const tokenUri = typeof json.token_uri === "string" ? json.token_uri : undefined;
  const onChain: JsonOnChain = {
    kind: "cw721",
    ...(tokenUri ? { uri: tokenUri } : {}),
  };
  if (tokenUri && /^(ipfs:|ar:|https?:)/.test(tokenUri)) {
    const remote = await withRemote(args, tokenUri, "cw721", onChain, {
      json,
      onChain,
      standardHint: "cw721",
    });
    if (isRecord(remote.json)) remote.json = { ...json, ...remote.json };
    return remote;
  }
  return documentFrom(json, "cw721", onChain);
}
