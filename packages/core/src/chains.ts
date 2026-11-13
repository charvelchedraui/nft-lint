import type { ChainDefinition } from "./types.js";

const nft = (base: string) => (contract: string, tokenId: string) =>
  `${base}/nft/${contract}/${tokenId}`;

/**
 * Launch chains for v1. EVM entries share one rule pack; only RPC, chain id,
 * and explorer differ. Solana uses the Metaplex pack.
 */
export const chains: ChainDefinition[] = [
  {
    id: "ethereum",
    name: "Ethereum",
    family: "evm",
    chainId: 1,
    caip2: "eip155:1",
    rpc: ["https://ethereum.publicnode.com", "https://eth.llamarpc.com"],
    explorer: "https://etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokenUrl: nft("https://etherscan.io"),
  },
  {
    id: "base",
    name: "Base",
    family: "evm",
    chainId: 8453,
    caip2: "eip155:8453",
    rpc: ["https://mainnet.base.org", "https://base.publicnode.com"],
    explorer: "https://basescan.org",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokenUrl: nft("https://basescan.org"),
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    family: "evm",
    chainId: 42161,
    caip2: "eip155:42161",
    rpc: ["https://arb1.arbitrum.io/rpc", "https://arbitrum-one.publicnode.com"],
    explorer: "https://arbiscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokenUrl: nft("https://arbiscan.io"),
  },
  {
    id: "optimism",
    name: "OP Mainnet",
    family: "evm",
    chainId: 10,
    caip2: "eip155:10",
    rpc: ["https://mainnet.optimism.io", "https://optimism.publicnode.com"],
    explorer: "https://optimistic.etherscan.io",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokenUrl: nft("https://optimistic.etherscan.io"),
  },
  {
    id: "bnb",
    name: "BNB Chain",
    family: "evm",
    chainId: 56,
    caip2: "eip155:56",
    rpc: ["https://bsc-dataseed.binance.org", "https://bsc.publicnode.com"],
    explorer: "https://bscscan.com",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    tokenUrl: nft("https://bscscan.com"),
  },
  {
    id: "avalanche",
    name: "Avalanche C-Chain",
    family: "evm",
    chainId: 43114,
    caip2: "eip155:43114",
    rpc: ["https://api.avax.network/ext/bc/C/rpc", "https://avalanche-c-chain.publicnode.com"],
    explorer: "https://snowtrace.io",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    tokenUrl: nft("https://snowtrace.io"),
  },
  {
    id: "robinhood",
    name: "Robinhood Chain",
    family: "evm",
    chainId: 4663,
    caip2: "eip155:4663",
    rpc: ["https://rpc.mainnet.chain.robinhood.com"],
    explorer: "https://robinhoodchain.blockscout.com",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    tokenUrl: (contract, tokenId) =>
      `https://robinhoodchain.blockscout.com/token/${contract}/instance/${tokenId}`,
  },
  {
    id: "polygon",
    name: "Polygon PoS",
    family: "evm",
    chainId: 137,
    caip2: "eip155:137",
    rpc: ["https://polygon-rpc.com", "https://polygon-bor.publicnode.com"],
    explorer: "https://polygonscan.com",
    nativeCurrency: { name: "POL", symbol: "POL", decimals: 18 },
    tokenUrl: nft("https://polygonscan.com"),
  },
  {
    id: "apechain",
    name: "ApeChain",
    family: "evm",
    chainId: 33139,
    caip2: "eip155:33139",
    rpc: ["https://rpc.apechain.com/http"],
    explorer: "https://apescan.io",
    nativeCurrency: { name: "ApeCoin", symbol: "APE", decimals: 18 },
    tokenUrl: nft("https://apescan.io"),
  },
  {
    id: "solana",
    name: "Solana",
    family: "solana",
    chainId: "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d",
    caip2: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d",
    rpc: ["https://api.mainnet-beta.solana.com"],
    explorer: "https://explorer.solana.com",
    nativeCurrency: { name: "Solana", symbol: "SOL", decimals: 9 },
    tokenUrl: (mint) => `https://explorer.solana.com/address/${mint}`,
  },
];

const ALIASES: Record<string, string> = {
  eth: "ethereum",
  ethereum: "ethereum",
  mainnet: "ethereum",
  base: "base",
  arb: "arbitrum",
  arbitrum: "arbitrum",
  "arbitrum-one": "arbitrum",
  op: "optimism",
  optimism: "optimism",
  "op-mainnet": "optimism",
  bnb: "bnb",
  bsc: "bnb",
  "bnb-chain": "bnb",
  avax: "avalanche",
  avalanche: "avalanche",
  "avalanche-c": "avalanche",
  robinhood: "robinhood",
  "robinhood-chain": "robinhood",
  polygon: "polygon",
  matic: "polygon",
  "polygon-pos": "polygon",
  ape: "apechain",
  apechain: "apechain",
  sol: "solana",
  solana: "solana",
};

export function getChain(idOrAlias: string): ChainDefinition | undefined {
  const id = ALIASES[idOrAlias.toLowerCase()] ?? idOrAlias.toLowerCase();
  return chains.find((chain) => chain.id === id);
}

export interface ChainTarget {
  chain: ChainDefinition;
  contract: string;
  tokenId: string;
  label: string;
}

/**
 * Parse `base:0xabc:1` or `solana:<mint>`. Returns null when the string is not a chain target.
 * Returns `{ unknown }` when the prefix looks like a chain alias that we do not ship.
 */
export function parseChainTarget(
  input: string,
): ChainTarget | { unknown: string; label: string } | null {
  const trimmed = input.trim();
  const colon = trimmed.indexOf(":");
  if (colon <= 0) return null;
  const prefix = trimmed.slice(0, colon).toLowerCase();
  if (!(prefix in ALIASES) && !chains.some((chain) => chain.id === prefix)) {
    return null;
  }
  const chain = getChain(prefix);
  const rest = trimmed.slice(colon + 1);
  if (!chain) return { unknown: prefix, label: trimmed };
  if (chain.family === "solana") {
    if (!rest || rest.includes(":")) return null;
    return { chain, contract: rest, tokenId: "0", label: trimmed };
  }
  const split = rest.lastIndexOf(":");
  if (split <= 0) return null;
  const contract = rest.slice(0, split);
  const tokenId = rest.slice(split + 1);
  if (!contract || tokenId.length === 0) return null;
  return { chain, contract, tokenId, label: trimmed };
}
