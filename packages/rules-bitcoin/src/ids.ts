/** Text form of an inscription id: 32-byte txid, then `i`, then the inscription index. */
export const INSCRIPTION_ID = /^[a-f0-9]{64}i\d+$/;

export function isInscriptionId(value: unknown): value is string {
  return typeof value === "string" && INSCRIPTION_ID.test(value);
}

const CONTENT_REF = /\/content\/([a-zA-Z0-9]+)/g;

export function contentRefs(value: string): string[] {
  return [...value.matchAll(CONTENT_REF)].map((match) => match[1] ?? "");
}

/** Content types ord and Magic Eden display. Unknown types are a warning, not a hard error. */
export const CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  "text/html",
  "text/plain",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/json",
  "audio/mpeg",
  "audio/wav",
  "audio/flac",
  "audio/ogg",
  "video/mp4",
  "video/webm",
  "model/gltf-binary",
  "model/gltf+json",
  "application/octet-stream",
]);

/** Practical size where indexers and marketplaces start to struggle. Not a consensus limit. */
export const INSCRIPTION_SIZE_WARN = 400_000;
