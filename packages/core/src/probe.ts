import type { LintConfig, NetworkClient, ProbeResult } from "./types.js";
import { gatewayUrls, parseUri, primaryFetchUrl } from "./uri.js";

export async function probeReference(
  reference: string,
  network: NetworkClient,
  config: LintConfig,
): Promise<ProbeResult> {
  const parsed = parseUri(reference);
  if (parsed.kind === "data") {
    const body = decodeDataUri(parsed.original);
    return {
      reference,
      ok: body !== null,
      status: body ? 200 : undefined,
      body: body ?? new Uint8Array(),
      contentLength: body?.byteLength,
      truncated: false,
      ...(body ? {} : { error: "Could not decode the data URI." }),
    };
  }
  if (parsed.kind === "invalid") {
    return {
      reference,
      ok: false,
      body: new Uint8Array(),
      truncated: false,
      error: parsed.reason,
    };
  }
  if (parsed.kind === "ipfs") {
    const targets = gatewayUrls(parsed, config.ipfsGateways);
    const gateways = await Promise.all(
      targets.map(async (url, index) => {
        const gateway = config.ipfsGateways[index] ?? url;
        try {
          const response = await network.fetch(url, { timeoutMs: config.timeoutMs });
          return {
            gateway,
            url,
            ok: response.ok,
            status: response.status,
            response,
          };
        } catch (error) {
          return {
            gateway,
            url,
            ok: false,
            error: error instanceof Error ? error.message : String(error),
            response: undefined,
          };
        }
      }),
    );
    const winner = gateways.find((entry) => entry.ok && entry.response);
    const chosen = winner ?? gateways[0];
    const response = chosen?.response;
    return {
      reference,
      requestedUrl: chosen?.url,
      ok: Boolean(winner),
      status: response?.status,
      contentType: response?.headers["content-type"],
      body: response?.body ?? new Uint8Array(),
      contentLength: contentLengthOf(response?.headers, response?.body, response?.truncated),
      truncated: response?.truncated ?? false,
      ...(winner ? {} : { error: chosen?.error ?? `No IPFS gateway returned this CID.` }),
      gateways: gateways.map(({ gateway, url, ok, status, error }) => ({
        gateway,
        url,
        ok,
        ...(status !== undefined ? { status } : {}),
        ...(error ? { error } : {}),
      })),
    };
  }
  const url = primaryFetchUrl(parsed, config.ipfsGateways);
  if (!url) {
    return {
      reference,
      ok: false,
      body: new Uint8Array(),
      truncated: false,
      error: "Could not turn this URI into a URL.",
    };
  }
  try {
    const response = await network.fetch(url, { timeoutMs: config.timeoutMs });
    return {
      reference,
      requestedUrl: url,
      ok: response.ok,
      status: response.status,
      contentType: response.headers["content-type"],
      body: response.body,
      contentLength: contentLengthOf(response.headers, response.body, response.truncated),
      truncated: response.truncated,
      ...(response.ok ? {} : { error: `HTTP ${response.status}` }),
    };
  } catch (error) {
    return {
      reference,
      requestedUrl: url,
      ok: false,
      body: new Uint8Array(),
      truncated: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function contentLengthOf(
  headers: Record<string, string> | undefined,
  body: Uint8Array | undefined,
  truncated: boolean | undefined,
): number | undefined {
  const header = headers?.["content-length"];
  if (header && Number.isFinite(Number(header))) return Number(header);
  if (!body || truncated) return undefined;
  return body.byteLength;
}

function decodeDataUri(value: string): Uint8Array | null {
  const comma = value.indexOf(",");
  if (comma === -1) return null;
  const meta = value.slice(5, comma);
  const data = value.slice(comma + 1);
  try {
    if (meta.includes(";base64")) {
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return bytes;
    }
    return new TextEncoder().encode(decodeURIComponent(data));
  } catch {
    return null;
  }
}

export async function fetchMetadataDocument(
  uri: string,
  network: NetworkClient,
  gateways: string[],
): Promise<{ raw: string; json: unknown; resolvedUrl: string }> {
  const parsed = parseUri(uri);
  const urls =
    parsed.kind === "ipfs"
      ? gatewayUrls(parsed, gateways)
      : [primaryFetchUrl(parsed, gateways)].filter((url): url is string => Boolean(url));
  if (urls.length === 0) throw new Error(`Cannot fetch metadata URI ${uri}.`);
  const errors: string[] = [];
  let reached: string | undefined;
  for (const url of urls) {
    try {
      const response = await network.fetch(url);
      if (!response.ok) {
        errors.push(`Metadata URL returned HTTP ${response.status} for ${url}.`);
        continue;
      }
      let raw: string;
      try {
        raw = new TextDecoder("utf-8", { fatal: true }).decode(response.body);
      } catch {
        errors.push(`Metadata at ${url} is not valid UTF-8.`);
        continue;
      }
      try {
        return { raw, json: JSON.parse(raw) as unknown, resolvedUrl: url };
      } catch (error) {
        const detail = error instanceof Error ? error.message : "not JSON";
        reached = `Metadata at ${url} is not JSON (${detail}).`;
        errors.push(reached);
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(reached ?? errors.at(-1) ?? `Cannot fetch metadata URI ${uri}.`);
}
