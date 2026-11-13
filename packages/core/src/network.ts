import type { NetworkClient } from "./types.js";

const USER_AGENT = "nft-lint/0.1.0";

export function createNetworkClient(options: {
  timeoutMs: number;
  maxBytes: number;
}): NetworkClient {
  return {
    async fetch(url, init) {
      const timeoutMs = init?.timeoutMs ?? options.timeoutMs;
      const response = await globalThis.fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs),
        method: init?.method ?? "GET",
        headers: {
          "user-agent": USER_AGENT,
          accept: "*/*",
          ...(init?.body ? { "content-type": "application/json" } : {}),
          ...init?.headers,
        },
        ...(init?.body ? { body: init.body } : {}),
      });
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });
      const cap = options.maxBytes;
      const { body, truncated } = await readBody(response, cap);
      return {
        ok: response.ok,
        status: response.status,
        headers,
        body,
        finalUrl: response.url || url,
        truncated,
      };
    },
  };
}

async function readBody(
  response: Response,
  cap: number,
): Promise<{ body: Uint8Array; truncated: boolean }> {
  const reader = response.body?.getReader();
  if (!reader) return { body: new Uint8Array(), truncated: false };
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncated = false;
  while (received < cap) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    if (received + value.byteLength > cap) {
      chunks.push(value.slice(0, cap - received));
      truncated = true;
      break;
    }
    chunks.push(value);
    received += value.byteLength;
  }
  if (!truncated) {
    const extra = await reader.read();
    if (!extra.done) truncated = true;
  }
  await reader.cancel().catch(() => undefined);
  const body = new Uint8Array(
    received > cap ? cap : chunks.reduce((sum, c) => sum + c.byteLength, 0),
  );
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { body, truncated };
}

export function headerNumber(headers: Record<string, string>, name: string): number | undefined {
  const value = headers[name.toLowerCase()];
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
