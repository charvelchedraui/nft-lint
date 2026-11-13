import { CID } from "multiformats/cid";

const GATEWAY_HOSTS = new Set([
  "ipfs.io",
  "gateway.ipfs.io",
  "dweb.link",
  "cloudflare-ipfs.com",
  "cf-ipfs.com",
  "gateway.pinata.cloud",
  "nftstorage.link",
  "w3s.link",
  "ipfs.infura.io",
  "4everland.io",
  "gateway.4everland.org",
  "ipfs.filebase.io",
  "gateway.lighthouse.storage",
]);

const ARWEAVE_HOSTS = new Set(["arweave.net", "arweave.dev", "www.arweave.net"]);

const AR_ID = /^[A-Za-z0-9_-]{43}$/;

export type ParsedUri =
  | {
      kind: "ipfs";
      cid: string;
      path: string;
      original: string;
      gatewayHost?: string;
      cidValid: boolean;
      redundantPrefix: boolean;
    }
  | {
      kind: "arweave";
      txId: string;
      original: string;
      txValid: boolean;
      gatewayHost?: string;
    }
  | { kind: "http"; url: string; host: string; original: string; secure: boolean }
  | { kind: "data"; original: string; mime?: string }
  | { kind: "invalid"; original: string; reason: string };

export function isValidCid(value: string): boolean {
  try {
    CID.parse(value.trim());
    return true;
  } catch {
    return false;
  }
}

export function isLocalHost(host: string): boolean {
  const name = host.replace(/^\[|\]$/g, "").toLowerCase();
  return (
    name === "localhost" ||
    name === "127.0.0.1" ||
    name === "0.0.0.0" ||
    name === "::1" ||
    name.endsWith(".local") ||
    name.endsWith(".localhost")
  );
}

export function isIpfsGatewayHost(host: string): boolean {
  const name = host.toLowerCase();
  if (GATEWAY_HOSTS.has(name)) return true;
  return name.endsWith(".ipfs.dweb.link") || name.endsWith(".ipfs.w3s.link");
}

export function parseUri(value: string): ParsedUri {
  const original = value.trim();
  if (!original) return { kind: "invalid", original, reason: "URI is empty." };
  if (original.startsWith("data:")) {
    const mime = original.slice(5).split(";")[0]?.split(",")[0];
    return { kind: "data", original, ...(mime ? { mime } : {}) };
  }
  if (original.startsWith("ipfs://")) {
    return parseIpfsPath(original.slice("ipfs://".length), original, undefined);
  }
  if (original.startsWith("ar://")) {
    const txId = original.slice("ar://".length).replace(/^\/+/, "");
    return { kind: "arweave", txId, original, txValid: AR_ID.test(txId) };
  }
  let url: URL;
  try {
    url = new URL(original);
  } catch {
    return { kind: "invalid", original, reason: "URI is not absolute." };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { kind: "invalid", original, reason: `Unsupported URI scheme "${url.protocol}".` };
  }
  const ipfs = ipfsFromHttp(url);
  if (ipfs) return ipfs;
  const arweave = arweaveFromHttp(url);
  if (arweave) return arweave;
  return {
    kind: "http",
    url: url.toString(),
    host: url.hostname,
    original,
    secure: url.protocol === "https:",
  };
}

function parseIpfsPath(spec: string, original: string, gatewayHost: string | undefined): ParsedUri {
  let body = spec.replace(/^\/+/, "");
  let redundantPrefix = false;
  if (body.startsWith("ipfs/")) {
    body = body.slice("ipfs/".length);
    redundantPrefix = true;
  }
  const slash = body.indexOf("/");
  const cid = slash === -1 ? body : body.slice(0, slash);
  const path = slash === -1 ? "" : body.slice(slash + 1);
  return {
    kind: "ipfs",
    cid,
    path,
    original,
    ...(gatewayHost ? { gatewayHost } : {}),
    cidValid: isValidCid(cid),
    redundantPrefix,
  };
}

function ipfsFromHttp(url: URL): ParsedUri | null {
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  const ipfsIndex = parts.findIndex((part) => part === "ipfs");
  if (ipfsIndex !== -1 && parts[ipfsIndex + 1]) {
    const cid = parts[ipfsIndex + 1]!;
    const path = parts.slice(ipfsIndex + 2).join("/");
    return {
      kind: "ipfs",
      cid,
      path,
      original: url.toString(),
      gatewayHost: host,
      cidValid: isValidCid(cid),
      redundantPrefix: false,
    };
  }
  const subdomain = host.match(/^(.+)\.ipfs\.(?:dweb\.link|w3s\.link)$/);
  if (subdomain?.[1]) {
    return {
      kind: "ipfs",
      cid: subdomain[1],
      path: parts.join("/"),
      original: url.toString(),
      gatewayHost: host,
      cidValid: isValidCid(subdomain[1]),
      redundantPrefix: false,
    };
  }
  return null;
}

function arweaveFromHttp(url: URL): ParsedUri | null {
  const host = url.hostname.toLowerCase();
  if (!ARWEAVE_HOSTS.has(host)) return null;
  const txId = url.pathname.split("/").filter(Boolean)[0] ?? "";
  return {
    kind: "arweave",
    txId,
    original: url.toString(),
    txValid: AR_ID.test(txId),
    gatewayHost: host,
  };
}

export function gatewayUrls(parsed: ParsedUri, gateways: string[]): string[] {
  if (parsed.kind !== "ipfs") return [];
  const suffix = parsed.path ? `${parsed.cid}/${parsed.path}` : parsed.cid;
  return gateways.map((gateway) => {
    const base = gateway.endsWith("/") ? gateway : `${gateway}/`;
    return `${base}${suffix}`;
  });
}

export function primaryFetchUrl(parsed: ParsedUri, gateways: string[]): string | null {
  if (parsed.kind === "ipfs") return gatewayUrls(parsed, gateways)[0] ?? null;
  if (parsed.kind === "arweave") {
    return parsed.txValid ? `https://arweave.net/${parsed.txId}` : null;
  }
  if (parsed.kind === "http") return parsed.url;
  return null;
}

export function inspectErc1155Uri(
  uri: string,
  tokenId?: string,
): { badPlaceholders: string[]; substituted?: string; idHex?: string } {
  const placeholders = uri.match(/\{[^}]+\}/g) ?? [];
  const badPlaceholders = placeholders.filter((token) => token !== "{id}");
  if (tokenId === undefined) return { badPlaceholders };
  let id: bigint;
  try {
    id = tokenId.startsWith("0x") || tokenId.startsWith("0X") ? BigInt(tokenId) : BigInt(tokenId);
  } catch {
    return { badPlaceholders };
  }
  if (id < 0n) return { badPlaceholders };
  const idHex = id.toString(16).padStart(64, "0");
  return {
    badPlaceholders,
    idHex,
    substituted: uri.replaceAll("{id}", idHex),
  };
}
