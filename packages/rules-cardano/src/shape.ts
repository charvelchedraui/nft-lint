import { isRecord, metadataUriIssue } from "@nft-lint/core";

export const POLICY_ID = /^[0-9a-fA-F]{56}$/;
export const CHUNK_BYTES = 64;

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function chunksOf(value: unknown): { parts: string[]; joined: string } | { error: string } {
  if (typeof value === "string") return { parts: [value], joined: value };
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((part) => typeof part !== "string")
  ) {
    return { error: "must be a string or an array of strings." };
  }
  const parts = value as string[];
  return { parts, joined: parts.join("") };
}

export function uriIssue(joined: string): string | null {
  if (/^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z2-7]+)$/.test(joined)) {
    return "is a bare CID. CIP-25 requires a scheme: ipfs://, ar://, https://, or data:.";
  }
  return metadataUriIssue(joined);
}

export interface AssetHit {
  path: string;
  body: Record<string, unknown>;
}

export function cip25Assets(json: Record<string, unknown>): AssetHit[] {
  const root = json["721"];
  if (!isRecord(root)) {
    if ("name" in json || "image" in json) return [{ path: "", body: json }];
    return [];
  }
  const hits: AssetHit[] = [];
  for (const [policy, assets] of Object.entries(root)) {
    if (policy === "version" || !isRecord(assets)) continue;
    for (const [name, body] of Object.entries(assets)) {
      if (name === "version" || !isRecord(body)) continue;
      hits.push({ path: `721.${policy}.${name}`, body });
    }
  }
  return hits;
}

export function cip68Body(json: Record<string, unknown>): {
  path: string;
  body: Record<string, unknown>;
} {
  if (isRecord(json.metadata) && ("name" in json.metadata || "image" in json.metadata)) {
    return { path: "metadata", body: json.metadata };
  }
  return { path: "", body: json };
}
