import { isRecord } from "@nft-lint/core";

export interface MediaRef {
  path: string;
  url: string;
  role: "image" | "animation" | "thumbnail";
}

export function mediaRefs(json: Record<string, unknown> | null): MediaRef[] {
  if (!json) return [];
  const refs: MediaRef[] = [];
  const take = (path: string, role: MediaRef["role"]) => {
    const value = json[path];
    if (typeof value === "string" && value.trim()) refs.push({ path, url: value.trim(), role });
  };
  take("image", "image");
  take("animation_url", "animation");
  take("artifactUri", "animation");
  take("displayUri", "image");
  take("thumbnailUri", "thumbnail");
  take("thumbnail_url", "thumbnail");
  take("image_url", "image");
  take("media_url", "image");
  take("content_url", "animation");
  pushString(refs, json.thumbnail, "thumbnail", "thumbnail");
  collectFormats(json, refs);
  collectFiles(json.files, "files", refs);
  collectExtension(json.extension, refs);
  collectFlow(json, refs);
  collectCardano(json, refs);
  return refs;
}

function pushString(refs: MediaRef[], value: unknown, path: string, role: MediaRef["role"]) {
  if (typeof value === "string" && value.trim()) refs.push({ path, url: value.trim(), role });
}

function collectFormats(json: Record<string, unknown>, refs: MediaRef[]) {
  if (!Array.isArray(json.formats)) return;
  json.formats.forEach((format, index) => {
    if (!isRecord(format)) return;
    pushString(refs, format.uri, `formats[${index}].uri`, "animation");
  });
}

function collectFiles(files: unknown, prefix: string, refs: MediaRef[]) {
  if (!Array.isArray(files)) return;
  files.forEach((file, index) => {
    if (!isRecord(file)) return;
    pushString(refs, file.src, `${prefix}[${index}].src`, "image");
    pushString(refs, file.uri, `${prefix}[${index}].uri`, "image");
    const nested = fileUri(file.file);
    if (nested) refs.push({ path: `${prefix}[${index}].file`, url: nested, role: "image" });
  });
}

function collectExtension(extension: unknown, refs: MediaRef[]) {
  if (!isRecord(extension)) return;
  pushString(refs, extension.image, "extension.image", "image");
  pushString(refs, extension.animation_url, "extension.animation_url", "animation");
}

function collectFlow(json: Record<string, unknown>, refs: MediaRef[]) {
  if (isRecord(json.display)) {
    const thumbnail = fileUri(json.display.thumbnail);
    if (thumbnail) refs.push({ path: "display.thumbnail", url: thumbnail, role: "thumbnail" });
  }
  for (const key of ["squareImage", "bannerImage"] as const) {
    const display = isRecord(json.collectionDisplay) ? json.collectionDisplay : null;
    const media = display && isRecord(display[key]) ? display[key] : null;
    const url = media ? fileUri(isRecord(media) ? (media.file ?? media) : media) : null;
    if (url) refs.push({ path: `collectionDisplay.${key}`, url, role: "image" });
  }
  collectFiles(json.medias, "medias", refs);
}

function collectCardano(json: Record<string, unknown>, refs: MediaRef[]) {
  const root = json["721"];
  if (!isRecord(root)) return;
  for (const [policy, assets] of Object.entries(root)) {
    if (!isRecord(assets)) continue;
    for (const [asset, body] of Object.entries(assets)) {
      if (!isRecord(body)) continue;
      const path = `721.${policy}.${asset}`;
      const image = joinChunks(body.image);
      if (image) refs.push({ path: `${path}.image`, url: image, role: "image" });
      collectFiles(body.files, `${path}.files`, refs);
    }
  }
}

function fileUri(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!isRecord(value)) return null;
  if (typeof value.url === "string" && value.url.trim()) return value.url.trim();
  if (typeof value.cid === "string" && value.cid.trim()) {
    const path = typeof value.path === "string" && value.path.trim() ? `/${value.path.trim()}` : "";
    return `ipfs://${value.cid.trim()}${path}`;
  }
  return fileUri(value.file);
}

function joinChunks(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (!Array.isArray(value) || value.some((part) => typeof part !== "string")) return null;
  const joined = value.join("").trim();
  return joined || null;
}

export function declaredMime(
  json: Record<string, unknown> | null,
  url: string,
): string | undefined {
  if (!json || !isRecord(json.properties) || !Array.isArray(json.properties.files))
    return undefined;
  const match = json.properties.files.find((file) => isRecord(file) && file.uri === url);
  if (!match || !isRecord(match) || typeof match.type !== "string") return undefined;
  return match.type;
}
