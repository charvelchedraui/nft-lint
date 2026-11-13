import type { ChainDefinition } from "./types.js";

const nft = (base: string) => (contract: string, tokenId: string) =>
  `${base}/nft/${contract}/${tokenId}`;

/**
 * Supported chains. EVM entries share one rule pack; only RPC, chain id, and
 * explorer differ. Every other family has its own pack.
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
  {
    id: "tezos",
    name: "Tezos",
    family: "tezos",
    chainId: "NetXdQprcVkpaWU",
    caip2: "tezos:NetXdQprcVkpaWU",
    rpc: ["https://api.tzkt.io", "https://rpc.tzkt.io/mainnet"],
    explorer: "https://tzkt.io",
    nativeCurrency: { name: "Tez", symbol: "XTZ", decimals: 6 },
    tokenUrl: (contract, tokenId) => `https://tzkt.io/${contract}/tokens/${tokenId}`,
  },
  {
    id: "bitcoin",
    name: "Bitcoin Ordinals",
    family: "bitcoin",
    chainId: "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
    caip2: "bip122:000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
    rpc: ["https://turbo.ordinalswallet.com", "https://ordinals.com"],
    explorer: "https://ordinals.com",
    nativeCurrency: { name: "Bitcoin", symbol: "BTC", decimals: 8 },
    tokenUrl: (inscriptionId) => `https://ordinals.com/inscription/${inscriptionId}`,
  },
  {
    id: "ton",
    name: "TON",
    family: "ton",
    chainId: -239,
    caip2: "ton:-239",
    rpc: ["https://tonapi.io"],
    explorer: "https://tonviewer.com",
    nativeCurrency: { name: "Toncoin", symbol: "TON", decimals: 9 },
    tokenUrl: (address) => `https://tonviewer.com/${address}`,
  },
  {
    id: "flow",
    name: "Flow",
    family: "flow",
    chainId: "mainnet",
    caip2: "flow:mainnet",
    rpc: ["https://rest-mainnet.onflow.org"],
    explorer: "https://www.flowscan.io",
    nativeCurrency: { name: "Flow", symbol: "FLOW", decimals: 8 },
    tokenUrl: (address, tokenId) => `https://www.flowscan.io/nft/${address}/${tokenId}`,
  },
  {
    id: "tron",
    name: "Tron",
    family: "tron",
    chainId: 728126428,
    caip2: "tron:mainnet",
    rpc: ["https://api.trongrid.io", "https://api.tronstack.io", "https://tron-rpc.publicnode.com"],
    explorer: "https://tronscan.org",
    nativeCurrency: { name: "Tron", symbol: "TRX", decimals: 6 },
    tokenUrl: (contract, tokenId) => `https://tronscan.org/#/token721/${contract}/${tokenId}`,
  },
  {
    id: "cardano",
    name: "Cardano",
    family: "cardano",
    chainId: "mainnet",
    caip2: "cardano:mainnet",
    rpc: ["https://api.koios.rest"],
    explorer: "https://cardanoscan.io",
    nativeCurrency: { name: "Ada", symbol: "ADA", decimals: 6 },
    tokenUrl: (policy, asset) => `https://cardanoscan.io/token/${policy}${asset}`,
  },
  {
    id: "algorand",
    name: "Algorand",
    family: "algorand",
    chainId: "wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
    caip2: "algorand:wGHE2Pwdvd7S12BL5FaOP20EGYesN73ktiC1qzkkit8=",
    rpc: ["https://mainnet-api.algonode.cloud", "https://mainnet-api.algonode.network"],
    explorer: "https://allo.info",
    nativeCurrency: { name: "Algo", symbol: "ALGO", decimals: 6 },
    tokenUrl: (assetId) => `https://allo.info/asset/${assetId}`,
  },
  {
    id: "sui",
    name: "Sui",
    family: "sui",
    chainId: "mainnet",
    caip2: "sui:mainnet",
    rpc: ["https://graphql.mainnet.sui.io/graphql"],
    explorer: "https://suiscan.xyz",
    nativeCurrency: { name: "Sui", symbol: "SUI", decimals: 9 },
    tokenUrl: (objectId) => `https://suiscan.xyz/mainnet/object/${objectId}`,
  },
  {
    id: "aptos",
    name: "Aptos",
    family: "aptos",
    chainId: 1,
    caip2: "aptos:1",
    rpc: ["https://fullnode.mainnet.aptoslabs.com/v1"],
    explorer: "https://explorer.aptoslabs.com",
    nativeCurrency: { name: "Aptos", symbol: "APT", decimals: 8 },
    tokenUrl: (objectId) => `https://explorer.aptoslabs.com/object/${objectId}?network=mainnet`,
  },
  {
    id: "stargaze",
    name: "Stargaze",
    family: "stargaze",
    chainId: "stargaze-1",
    caip2: "cosmos:stargaze-1",
    rpc: [
      "https://cosmos-rest.publicnode.com",
      "https://hub-rest.stargaze-apis.com",
      "https://rest.cosmos.directory/cosmoshub",
      "https://lcd-cosmoshub.keplr.app",
    ],
    explorer: "https://www.mintscan.io/stargaze",
    nativeCurrency: { name: "Stargaze", symbol: "STARS", decimals: 6 },
    tokenUrl: (contract, tokenId) => `https://www.stargaze.zone/marketplace/${contract}/${tokenId}`,
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
  xtz: "tezos",
  tezos: "tezos",
  btc: "bitcoin",
  bitcoin: "bitcoin",
  ordinals: "bitcoin",
  ton: "ton",
  flow: "flow",
  trx: "tron",
  tron: "tron",
  ada: "cardano",
  cardano: "cardano",
  algo: "algorand",
  algorand: "algorand",
  sui: "sui",
  apt: "aptos",
  aptos: "aptos",
  stars: "stargaze",
  stargaze: "stargaze",
};

/** Chains whose target is a single id, not contract:tokenId. */
const WHOLE_REST = new Set(["solana", "bitcoin", "ton", "algorand", "sui", "aptos"]);

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
  if (WHOLE_REST.has(chain.id)) {
    if (!rest) return null;
    if (chain.family === "solana" && rest.includes(":")) return null;
    return { chain, contract: rest, tokenId: "0", label: trimmed };
  }
  const split = rest.lastIndexOf(":");
  if (split <= 0) return null;
  const contract = rest.slice(0, split);
  const tokenId = rest.slice(split + 1);
  if (!contract || tokenId.length === 0) return null;
  return { chain, contract, tokenId, label: trimmed };
}
