import { encodeFunctionData } from "viem";
import { describe, expect, it } from "vitest";
import {
  chains,
  collectionFindings,
  formatMarkdown,
  formatSarif,
  getChain,
  inspectErc1155Uri,
  isValidCid,
  lint,
  parseChainTarget,
  parseMetadataJson,
  parseUri,
  resolveConfig,
  type LintReport,
} from "@nft-lint/core";
import { defaultRules } from "@nft-lint/preset";
import {
  ERC2981_INTERFACE,
  ERC721_INTERFACE,
  erc1155Abi,
  erc721Abi,
  mapCoreAsset,
  mapTokenMetadata,
  readEvmNft,
  type EvmReader,
} from "@nft-lint/fetchers";

const image = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/1.png";

const base = {
  name: "Glass Finch",
  description: "Kiln-fired glass bird.",
  image,
  external_url: "https://gallery.example/finch/1",
  background_color: "e8dcc8",
  attributes: [{ trait_type: "Plumage", value: "Amber" }],
};

async function run(input: Parameters<typeof lint>[0]) {
  return lint(input, { rules: defaultRules, env: {}, offline: true });
}

describe("chains", () => {
  it("ships all 20 chains", () => {
    expect(chains.map((chain) => chain.id)).toEqual([
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
      "tezos",
      "bitcoin",
      "ton",
      "flow",
      "tron",
      "cardano",
      "algorand",
      "sui",
      "aptos",
      "stargaze",
    ]);
    for (const chain of chains) {
      expect(chain.chainId).toBeTruthy();
      expect(chain.rpc.length).toBeGreaterThan(0);
      expect(chain.explorer.startsWith("https://")).toBe(true);
      expect(chain.caip2).toContain(":");
    }
    expect(getChain("base")?.chainId).toBe(8453);
    expect(getChain("robinhood")?.chainId).toBe(4663);
    expect(getChain("ape")?.chainId).toBe(33139);
    expect(getChain("op")?.name).toBe("OP Mainnet");
    expect(getChain("sol")?.chainId).toBe("5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d");
    expect(getChain("xtz")?.family).toBe("tezos");
    expect(getChain("ordinals")?.id).toBe("bitcoin");
    expect(getChain("trx")?.chainId).toBe(728126428);
    expect(getChain("stars")?.caip2).toBe("cosmos:stargaze-1");
    expect(getChain("matic")?.rpc[0]).toMatch(/^https:\/\//);
  });

  it("parses chain targets and leaves urls alone", () => {
    const parsed = parseChainTarget("base:0x2222222222222222222222222222222222222222:1");
    expect(parsed && "chain" in parsed && parsed.chain.id).toBe("base");
    expect(parsed && "tokenId" in parsed && parsed.tokenId).toBe("1");
    expect(parseChainTarget("https://example.com/1.json")).toBeNull();
    const sol = parseChainTarget("solana:MintAddress111111111111111111111111111");
    expect(sol && "chain" in sol && sol.chain.family).toBe("solana");
    const tez = parseChainTarget("tezos:KT1abc:12");
    expect(tez && "chain" in tez && tez.chain.id).toBe("tezos");
    expect(tez && "tokenId" in tez && tez.tokenId).toBe("12");
    const ord = parseChainTarget("btc:abcdefi0");
    expect(ord && "contract" in ord && ord.contract).toBe("abcdefi0");
  });
});

describe("parse and uri", () => {
  it("finds duplicate keys and records a line", () => {
    const parsed = parseMetadataJson('{\n  "name": "a",\n  "name": "b"\n}\n');
    expect(parsed.ok).toBe(true);
    expect(parsed.duplicatePaths).toEqual(["name"]);
    expect(parsed.locations.get("name")?.line).toBe(2);
  });

  it("rejects invalid json and notices a bom", () => {
    expect(parseMetadataJson("{").ok).toBe(false);
    expect(parseMetadataJson("\uFEFF{}").hasBom).toBe(true);
  });

  it("validates cids and ipfs gateway urls", () => {
    expect(isValidCid("bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi")).toBe(true);
    expect(isValidCid("not-a-cid")).toBe(false);
    const gateway = parseUri(
      "https://gateway.pinata.cloud/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/1.png",
    );
    expect(gateway.kind).toBe("ipfs");
    if (gateway.kind === "ipfs") expect(gateway.gatewayHost).toBe("gateway.pinata.cloud");
    const local = parseUri("http://localhost/1.png");
    expect(local.kind).toBe("http");
  });

  it("substitutes erc-1155 ids", () => {
    const inspected = inspectErc1155Uri("ipfs://cid/{id}.json", "255");
    expect(inspected.idHex).toBe(
      "00000000000000000000000000000000000000000000000000000000000000ff",
    );
    expect(inspected.substituted).toContain(inspected.idHex ?? "");
    expect(inspectErc1155Uri("ipfs://cid/{ID}.json").badPlaceholders).toEqual(["{ID}"]);
  });
});

describe("config", () => {
  it("lets the environment override a file, and the cli override the environment", () => {
    const resolved = resolveConfig({
      config: { rpc: { base: ["https://file.example"] }, royaltyWarnAbovePercent: 8 },
      env: { NFT_LINT_RPC_BASE: "https://env.example", NFT_LINT_OFFLINE: "1" },
      rpc: { base: ["https://cli.example"] },
    });
    expect(resolved.rpc.base).toEqual(["https://cli.example"]);
    expect(resolved.offline).toBe(true);
    expect(resolved.royaltyWarnAbovePercent).toBe(8);
    expect(resolved.rpc.ethereum.length).toBeGreaterThan(0);
  });
});

describe("rules that need injected chain facts", () => {
  it("warns when the royalty receiver is zero or the contract uri disagrees", async () => {
    const report = await run({
      json: base,
      standard: "erc-721",
      contract: "0x2222222222222222222222222222222222222222",
      onChain: {
        kind: "erc-721",
        tokenUri: "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/1.json",
        supports2981: true,
        royalty: {
          receiver: "0x0000000000000000000000000000000000000000",
          salePrice: "10000",
          amount: "2500",
        },
        contractMetadata: {
          name: "Glass Finch",
          image,
          seller_fee_basis_points: 500,
          fee_recipient: "0x1111111111111111111111111111111111111111",
        },
      },
    });
    const messages = report.findings.map((finding) => finding.message).join("\n");
    expect(messages).toContain("zero address");
    expect(messages).toContain("25%");
    expect(messages).toContain("basis points");
    expect(messages).toContain("does not match");
  });

  it("warns on a date stored as milliseconds", async () => {
    const report = await run({
      json: {
        ...base,
        attributes: [{ trait_type: "Hatched", display_type: "date", value: 1_700_000_000_000 }],
      },
    });
    expect(report.findings.some((finding) => finding.message.includes("milliseconds"))).toBe(true);
  });
});

describe("collection and formats", () => {
  it("flags mixed trait types across a folder", () => {
    const findings = collectionFindings([
      {
        target: "a.json",
        report: emptyReport(),
        json: { attributes: [{ trait_type: "Hat", value: "Cap" }] },
      },
      {
        target: "b.json",
        report: emptyReport(),
        json: { attributes: [{ trait_type: "Hat", value: 1 }] },
      },
    ]);
    expect(findings[0]?.ruleId).toBe("common/trait-type-consistency");
    expect(findings[0]?.message).toContain("Hat");
  });

  it("renders markdown and sarif", async () => {
    const report = await run({ json: { name: "Only a name" } });
    expect(formatMarkdown(report)).toContain("evm/required-fields");
    const sarif = JSON.parse(formatSarif([report])) as {
      version: string;
      runs: { results: { level: string; ruleId: string }[] }[];
    };
    expect(sarif.version).toBe("2.1.0");
    expect(sarif.runs[0]?.results.some((result) => result.level === "error")).toBe(true);
  });
});

describe("fetchers", () => {
  it("encodes the erc interfaces it claims to call", () => {
    expect(
      encodeFunctionData({ abi: erc721Abi, functionName: "tokenURI", args: [1n] }).startsWith(
        "0xc87b56dd",
      ),
    ).toBe(true);
    expect(
      encodeFunctionData({
        abi: erc721Abi,
        functionName: "supportsInterface",
        args: [ERC721_INTERFACE],
      }).startsWith("0x01ffc9a7"),
    ).toBe(true);
    expect(
      encodeFunctionData({
        abi: erc721Abi,
        functionName: "royaltyInfo",
        args: [1n, 10_000n],
      }).startsWith(ERC2981_INTERFACE),
    ).toBe(true);
    expect(
      encodeFunctionData({ abi: erc1155Abi, functionName: "uri", args: [1n] }).startsWith(
        "0x0e89341c",
      ),
    ).toBe(true);
  });

  it("reads erc-721 facts from an injected caller", async () => {
    const reader: EvmReader = {
      async supportsInterface(id) {
        return id === ERC721_INTERFACE || id === ERC2981_INTERFACE;
      },
      async tokenUri() {
        return "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/1.json";
      },
      async uri() {
        throw new Error("not 1155");
      },
      async contractUri() {
        return "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/contract.json";
      },
      async royaltyInfo() {
        return { receiver: "0x1111111111111111111111111111111111111111", amount: 500n };
      },
    };
    const facts = await readEvmNft(reader, 1n);
    expect(facts.kind).toBe("erc-721");
    expect(facts.supports2981).toBe(true);
    expect(facts.royalty).toEqual({
      receiver: "0x1111111111111111111111111111111111111111",
      salePrice: "10000",
      amount: "500",
    });
  });

  it("falls back to erc-1155 uri when tokenURI reverts", async () => {
    const reader: EvmReader = {
      async supportsInterface() {
        return false;
      },
      async tokenUri() {
        throw new Error("missing");
      },
      async uri() {
        return "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/{id}.json";
      },
      async contractUri() {
        throw new Error("none");
      },
      async royaltyInfo() {
        throw new Error("none");
      },
    };
    const facts = await readEvmNft(reader, 1n);
    expect(facts.kind).toBe("erc-1155");
    expect(facts.tokenUri).toContain("{id}");
  });

  it("maps metaplex account data into on-chain facts", () => {
    const token = mapTokenMetadata({
      metadata: {
        name: "Glass Finch\0\0",
        symbol: "FINCH",
        uri: "ipfs://cid",
        sellerFeeBasisPoints: 500,
        creators: {
          __option: "Some",
          value: [{ address: { toString: () => "Creator111" }, share: 100, verified: true }],
        },
      },
    } as never);
    expect(token.name).toBe("Glass Finch");
    expect(token.creators?.[0]?.share).toBe(100);

    const core = mapCoreAsset({
      name: "Glass Finch",
      uri: "ipfs://cid",
      royalties: {
        basisPoints: 500,
        creators: [{ address: { toString: () => "Creator111" }, percentage: 100 }],
      },
      attributes: { attributeList: [{ key: "Plumage", value: "Amber" }] },
    } as never);
    expect(core.kind).toBe("metaplex-core");
    expect(core.sellerFeeBasisPoints).toBe(500);
    expect(core.attributes?.[0]).toEqual({ trait_type: "Plumage", value: "Amber" });
  });
});

function emptyReport(): LintReport {
  return {
    target: "",
    standard: "unknown",
    chain: null,
    metadata: null,
    findings: [],
    skippedRules: [],
    summary: { errors: 0, warnings: 0, infos: 0 },
  };
}
