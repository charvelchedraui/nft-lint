import { describe, expect, it } from "vitest";
import {
  createNetworkClient,
  defaultConfig,
  getChain,
  isRecord,
  type ChainDefinition,
  type ResolveOnChain,
} from "@nft-lint/core";
import {
  resolveAlgorand,
  resolveAptos,
  resolveBitcoin,
  resolveCardano,
  resolveEvm,
  resolveFlow,
  resolveStargaze,
  resolveSui,
  resolveTezos,
  resolveTon,
  resolveTron,
} from "@nft-lint/fetchers";
import { lint } from "@nft-lint/preset";

/**
 * Live public-network smoke test. Not part of `pnpm test`.
 * Run with `pnpm live` or `LIVE=1 vitest run tests/live.test.ts`.
 */
const enabled = process.env.LIVE === "1";

interface Sample {
  chain: string;
  contract: string;
  tokenId: string;
  resolve: ResolveOnChain;
  note: string;
  allowNonJson?: boolean;
}

const samples: Sample[] = [
  {
    chain: "tezos",
    contract: "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton",
    tokenId: "152",
    resolve: resolveTezos,
    note: "hic et nunc",
  },
  {
    chain: "bitcoin",
    contract: "6fb976ab49dcec017f1e201e84395983204ae1a7c2abf7ced0a85d692e442799i0",
    tokenId: "0",
    resolve: resolveBitcoin,
    note: "inscription 0",
  },
  {
    chain: "ton",
    contract: "0:30ed366b91e98c93f9323aabfd8a97947d7b4524e28ccfb5d202f24abeee55c3",
    tokenId: "0",
    resolve: resolveTon,
    note: "tonapi royalty_params",
  },
  {
    chain: "flow",
    contract: "0xc1c4d3ac4e652be3",
    tokenId: "53141844",
    resolve: resolveFlow,
    note: "Top Shot Display",
  },
  {
    chain: "tron",
    contract: "THjYwnDDN6aYxrzKb88CSMTEYjBuHpoYxS",
    tokenId: "1",
    resolve: resolveTron,
    note: "Devikins",
  },
  {
    chain: "cardano",
    contract: "d5e6bf0500378d4f0da4e8dde6becec7621cd8cbf5cbb9b87013d4cc",
    tokenId: "537061636542756431",
    resolve: resolveCardano,
    note: "SpaceBud #1 CIP-25",
  },
  {
    chain: "cardano",
    contract: "4523c5e21d409b81c95b45b0aea275b8ea1406e6cafea5583b9f8a5f",
    tokenId: "000643b042756431303034",
    resolve: resolveCardano,
    note: "SpaceBud #1004 CIP-68",
  },
  {
    chain: "algorand",
    contract: "560421434",
    tokenId: "0",
    resolve: resolveAlgorand,
    note: "ARC-3",
  },
  {
    chain: "algorand",
    contract: "587702531",
    tokenId: "0",
    resolve: resolveAlgorand,
    note: "ARC-19 v1 dag-pb",
  },
  {
    chain: "algorand",
    contract: "802356435",
    tokenId: "0",
    resolve: resolveAlgorand,
    note: "ARC-19 v1 raw",
  },
  {
    chain: "algorand",
    contract: "710742847",
    tokenId: "0",
    resolve: resolveAlgorand,
    note: "ARC-19 v0 dag-pb",
    allowNonJson: true,
  },
  {
    chain: "sui",
    contract: "0xab4defe1c4b49112738f2fe8a114179b1479ffe6b4d6c223d262f1301a9b1c32",
    tokenId: "0",
    resolve: resolveSui,
    note: "SuiFren Display",
  },
  {
    chain: "aptos",
    contract: "0xa0cd1476e4e32462ac1787037b00f416e1f6b22f07912ab70a067679910830b3",
    tokenId: "0",
    resolve: resolveAptos,
    note: "token v2",
  },
  {
    chain: "aptos",
    contract:
      "0xf932dcb9835e681b21d2f411ef99f4f5e577e6ac299eebee2272a39fb348f702::Aptos Monkeys::AptosMonkeys #1",
    tokenId: "0",
    resolve: resolveAptos,
    note: "token v1",
  },
  {
    chain: "stargaze",
    contract: "cosmos1pq7vpw5k3ad4jlaskuhm66gjapump23zz69ut9fck2p5k5p4sq9s79da69",
    tokenId: "stargazer",
    resolve: resolveStargaze,
    note: "Stargaze Names on Cosmos Hub",
  },
  {
    chain: "ethereum",
    contract: "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D",
    tokenId: "1",
    resolve: resolveEvm,
    note: "BAYC",
  },
];

describe.skipIf(!enabled)("live readers", () => {
  const network = createNetworkClient({ timeoutMs: 20_000, maxBytes: 2_000_000 });
  const config = defaultConfig();
  config.timeoutMs = 20_000;

  for (const item of samples) {
    it(`${item.chain} ${item.note}`, async () => {
      const chain = getChain(item.chain);
      expect(chain, item.chain).toBeTruthy();
      const asset = await item.resolve({
        chain: chain as ChainDefinition,
        contract: item.contract,
        tokenId: item.tokenId,
        config,
        network,
      });
      if (item.allowNonJson) {
        expect(asset.uri).toBe("ipfs://QmSZkUNZFGxShNFbfozD1GsXW74U2tdSqeRpKmPtfnAad7");
        expect(asset.error ?? "").toMatch(/not JSON/);
      } else {
        expect(asset.error, JSON.stringify(asset).slice(0, 500)).toBeUndefined();
        expect(asset.json, JSON.stringify(asset).slice(0, 500)).toBeTruthy();
      }
      expectSpecific(item.note, asset.json);
      const report = await lint(
        {
          json: asset.json,
          chain: item.chain,
          ...(asset.standardHint ? { standard: asset.standardHint } : {}),
          ...(asset.onChain ? { onChain: asset.onChain } : {}),
          ...(asset.uri ? { uri: asset.uri } : {}),
          label: `${item.chain}:${item.note}`,
        },
        { offline: true, network },
      );
      expect(report.standard).not.toBe("unknown");
      const errors = report.findings.filter((finding) => finding.severity === "error");
      if (errors.length > 0) {
        console.log(
          `${item.note} content findings: ${errors.map((finding) => `${finding.ruleId} ${finding.path}: ${finding.message}`).join(" | ")}`,
        );
      }
    }, 45_000);
  }

  it("sanity-checks launch chain RPCs", async () => {
    const ids = [
      "ethereum",
      "base",
      "arbitrum",
      "optimism",
      "bnb",
      "avalanche",
      "robinhood",
      "polygon",
      "apechain",
      "solana",
    ];
    const failures: string[] = [];
    for (const id of ids) {
      const chain = getChain(id);
      if (!chain) {
        failures.push(`${id} missing`);
        continue;
      }
      let ok = false;
      const notes: string[] = [];
      for (const rpc of chain.rpc) {
        try {
          if (chain.family === "solana") {
            const response = await network.fetch(rpc, {
              method: "POST",
              body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot", params: [] }),
              timeoutMs: 20_000,
            });
            const text = new TextDecoder().decode(response.body);
            if (response.ok && text.includes("result")) ok = true;
            else notes.push(`${rpc} ${response.status} ${text.slice(0, 80)}`);
          } else {
            const response = await network.fetch(rpc, {
              method: "POST",
              body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
              timeoutMs: 20_000,
            });
            const text = new TextDecoder().decode(response.body);
            if (response.ok && text.includes("result")) ok = true;
            else notes.push(`${rpc} ${response.status} ${text.slice(0, 120)}`);
          }
        } catch (error) {
          notes.push(`${rpc} ${error instanceof Error ? error.message : String(error)}`);
        }
        if (ok) break;
      }
      if (!ok) failures.push(`${id} ${notes.join(" | ")}`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  }, 90_000);
});

function expectSpecific(note: string, json: unknown) {
  if (!isRecord(json)) return;
  if (note === "tonapi royalty_params") {
    expect(isRecord(json.royalty_params)).toBe(true);
    const royalty = json.royalty_params as Record<string, unknown>;
    expect(royalty.numerator).toBe(75);
    expect(royalty.denominator).toBe(1000);
    expect(royalty.destination).toMatch(/^0:[0-9a-f]{64}$/);
  }
  if (note === "Top Shot Display") {
    expect(isRecord(json.display)).toBe(true);
    expect(typeof (json.display as Record<string, unknown>).name).toBe("string");
  }
  if (note === "inscription 0") {
    expect(json.content_type).toBe("image/png");
    expect(json.inscription_id).toMatch(/i0$/);
    expect(json.delegate).toBeUndefined();
  }
  if (note === "SuiFren Display") {
    expect(json.description).toBe("My SuiFren!");
    expect(String(json.image_url)).not.toMatch(/\{[^{]/);
  }
  if (note === "SpaceBud #1004 CIP-68") {
    expect(json.name).toBe("SpaceBud #1004");
    expect(json.version).toBe(1);
  }
  if (note === "ARC-19 v1 dag-pb") {
    expect(String(json.name ?? "")).toMatch(/Template IPFS/);
  }
  if (note === "ARC-19 v1 raw") {
    expect(String(json.name ?? "")).toMatch(/ARC19/);
  }
  if (note === "token v1") {
    expect(json.name).toBe("AptosMonkeys #1");
    const royalty = json.royalty;
    expect(isRecord(royalty)).toBe(true);
    expect((royalty as Record<string, unknown>).numerator).toBe("500");
    expect((royalty as Record<string, unknown>).denominator).toBe("10000");
  }
  if (note === "Stargaze Names on Cosmos Hub") {
    expect(json.name).toBe("Stargaze Names");
    const royalty = json.royalty_info;
    expect(isRecord(royalty)).toBe(true);
    expect((royalty as Record<string, unknown>).share).toBe("0.05");
    expect(String((royalty as Record<string, unknown>).payment_address)).toMatch(/^cosmos1/);
  }
}
