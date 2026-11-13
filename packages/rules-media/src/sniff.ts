import { fileTypeFromBuffer } from "file-type";

const EXT_MIME: Record<string, string[]> = {
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  gif: ["image/gif"],
  webp: ["image/webp"],
  svg: ["image/svg+xml"],
  mp4: ["video/mp4"],
  webm: ["video/webm"],
  mp3: ["audio/mpeg"],
  wav: ["audio/wav", "audio/wave", "audio/x-wav"],
  ogg: ["audio/ogg"],
  glb: ["model/gltf-binary"],
  gltf: ["model/gltf+json"],
  json: ["application/json"],
  html: ["text/html"],
};

export function extensionOf(url: string): string | undefined {
  const clean = url.split("?")[0]?.split("#")[0] ?? url;
  const last = clean.split("/").pop() ?? "";
  const dot = last.lastIndexOf(".");
  if (dot <= 0) return undefined;
  return last.slice(dot + 1).toLowerCase();
}

export function mimeForExtension(extension: string | undefined): string[] | undefined {
  if (!extension) return undefined;
  return EXT_MIME[extension];
}

export async function sniffMime(body: Uint8Array): Promise<string | undefined> {
  const head = new TextDecoder().decode(body.slice(0, 240)).trimStart().toLowerCase();
  if (head.startsWith("<svg") || (head.startsWith("<?xml") && head.includes("<svg"))) {
    return "image/svg+xml";
  }
  if (head.startsWith("<!doctype html") || head.startsWith("<html")) return "text/html";
  if (head.startsWith("{") || head.startsWith("[")) return "application/json";
  try {
    const found = await fileTypeFromBuffer(body);
    return found?.mime;
  } catch {
    return undefined;
  }
}
