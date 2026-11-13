import { isRecord, metadataUriIssue } from "@nft-lint/core";

const FLOW_ADDRESS = /^0x[0-9a-fA-F]{1,16}$/;

export function isFlowAddress(value: string): boolean {
  return FLOW_ADDRESS.test(value);
}

/** HTTPFile `{url}` or IPFSFile `{cid, path}` as serialized from MetadataViews. */
export function fileIssue(value: unknown): string | null {
  if (typeof value === "string") return metadataUriIssue(value);
  if (!isRecord(value)) return "must be an HTTPFile {url} or an IPFSFile {cid, path}.";
  if (typeof value.url === "string") return metadataUriIssue(value.url);
  if (typeof value.cid === "string") {
    const path = typeof value.path === "string" && value.path ? `/${value.path}` : "";
    return metadataUriIssue(`ipfs://${value.cid}${path}`);
  }
  if (isRecord(value.file)) return fileIssue(value.file);
  return "must be an HTTPFile {url} or an IPFSFile {cid, path}.";
}

export function asList(value: unknown, key: string): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (isRecord(value) && Array.isArray(value[key])) return value[key];
  return null;
}
