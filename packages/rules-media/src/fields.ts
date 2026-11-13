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
  return refs;
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
