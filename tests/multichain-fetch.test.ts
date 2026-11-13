import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { defaultConfig, type NetworkClient } from "@nft-lint/core";
import { algorandReserveCid, resolveTezos, resolveTron } from "@nft-lint/fetchers";

function client(
  map: Record<string, { status?: number; body: unknown; contentType?: string }>,
): NetworkClient {
  return {
    async fetch(url, init) {
      const key = init?.method === "POST" ? `POST ${url}` : url;
      const spec = map[key] ?? map[url];
      if (!spec) throw new Error(`Unexpected fetch ${key}`);
      const raw = typeof spec.body === "string" ? spec.body : JSON.stringify(spec.body);
      return {
        ok: (spec.status ?? 200) < 300,
        status: spec.status ?? 200,
        headers: { "content-type": spec.contentType ?? "application/json" },
        body: new TextEncoder().encode(raw),
        finalUrl: url,
        truncated: false,
      };
    },
  };
}

describe("multichain readers", () => {
  it("reads Tezos token metadata from TzKT", async () => {
    const config = defaultConfig();
    const metadata = { name: "Glass Finch", artifactUri: "ipfs://bafy" };
    const report = await resolveTezos({
      chain: { ...config, id: "tezos", family: "tezos", rpc: ["https://api.tzkt.io"] } as never,
      contract: "KT1abc",
      tokenId: "1",
      config,
      network: client({
        "https://api.tzkt.io/v1/tokens?contract=KT1abc&tokenId=1&limit=1": {
          body: [{ metadata }],
        },
      }),
    });
    expect(report.json).toEqual(metadata);
    expect(report.standardHint).toBe("tzip-21");
  });

  it("flags a TRC-721 tokenURI that returns HTML", async () => {
    const config = defaultConfig();
    const html = "<!DOCTYPE html><html></html>";
    const report = await resolveTron({
      chain: { id: "tron", family: "tron", rpc: ["https://api.trongrid.io"] } as never,
      contract: "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
      tokenId: "1",
      config,
      network: client({
        "POST https://api.trongrid.io/wallet/triggerconstantcontract": {
          body: { constant_result: [abiString("https://cdn.example/meta")] },
        },
        "https://cdn.example/meta": { body: html, contentType: "text/html" },
      }),
    });
    expect(report.error).toMatch(/HTML/);
    expect(report.onChain?.kind).toBe("trc-721");
  });

  it("rejects an ARC-19 reserve address with a bad checksum", () => {
    expect(
      algorandReserveCid("template-ipfs://{ipfscid:1:raw:reserve:sha2-256}", "A".repeat(58)),
    ).toBeNull();
  });

  it("builds a CID from a reserve address whose checksum matches", () => {
    const digest = createHash("sha256").update("finch").digest();
    const checksum = createHash("sha512-256").update(digest).digest().subarray(28);
    const address = base32(Buffer.concat([digest, checksum]));
    const cid = algorandReserveCid("template-ipfs://{ipfscid:1:raw:reserve:sha2-256}", address);
    expect(cid?.startsWith("b")).toBe(true);
    expect(cid && cid.length).toBeGreaterThan(20);
  });
});

function abiString(value: string): string {
  const bytes = Buffer.from(value, "utf8");
  const offset = "20".padStart(64, "0");
  const length = bytes.length.toString(16).padStart(64, "0");
  const data = bytes.toString("hex").padEnd(Math.ceil(bytes.length / 32) * 64, "0");
  return offset + length + data;
}

function base32(bytes: Buffer): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alphabet[(value >> bits) & 31];
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}
