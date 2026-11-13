export const VERSION = "0.1.0";

export const REPO_URL = "https://github.com/charvelchedraui/nft-lint";

export function ruleDocUrl(id: string): string {
  return `${REPO_URL}/blob/main/docs/rules/${id}.md`;
}

export type Severity = "error" | "warn" | "info";

export type StandardId =
  "erc-721" | "erc-1155" | "metaplex-token-metadata" | "metaplex-core" | "unknown";

export type ChainFamily = "evm" | "solana";

export interface Finding {
  ruleId: string;
  severity: Severity;
  path: string;
  message: string;
  docs: string;
  line?: number;
  column?: number;
}

export interface SourceLocation {
  line: number;
  column: number;
}

export interface ChainDefinition {
  /** Stable id used by the CLI, for example `base` or `solana`. */
  id: string;
  name: string;
  family: ChainFamily;
  /**
   * EIP-155 chain id for EVM chains.
   * Solana has no EIP-155 id; this is the mainnet-beta genesis hash.
   */
  chainId: number | string;
  caip2: string;
  /** Default public RPC URLs. Override with `--rpc`, config, or `NFT_LINT_RPC_*`. */
  rpc: string[];
  explorer: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  tokenUrl: (contract: string, tokenId: string) => string;
}

export interface SolanaCreator {
  address: string;
  share: number;
  verified?: boolean;
}

export interface TraitAttribute {
  trait_type: string;
  value: string | number;
}

export interface ErcOnChain {
  kind: "erc-721" | "erc-1155";
  tokenUri?: string;
  contractUri?: string;
  contractMetadata?: unknown;
  supportsErc721?: boolean;
  supportsErc1155?: boolean;
  supports2981?: boolean;
  royalty?: { receiver: string; salePrice: string; amount: string };
  readError?: string;
}

export interface SolanaOnChain {
  kind: "metaplex-token-metadata" | "metaplex-core";
  name?: string;
  symbol?: string;
  uri?: string;
  sellerFeeBasisPoints?: number;
  creators?: SolanaCreator[];
  attributes?: TraitAttribute[];
  readError?: string;
}

export type OnChainFacts = ErcOnChain | SolanaOnChain;

export interface RuleOverride {
  enabled?: boolean;
  severity?: Severity;
}

export interface LintConfig {
  offline: boolean;
  maxImageBytes: number;
  maxThumbnailBytes: number;
  royaltyWarnAbovePercent: number;
  timeoutMs: number;
  ipfsGateways: string[];
  rpc: Record<string, string[]>;
  rules: Record<string, RuleOverride>;
}

export interface HttpResponse {
  ok: boolean;
  status: number;
  headers: Record<string, string>;
  body: Uint8Array;
  finalUrl: string;
  truncated: boolean;
}

export interface NetworkClient {
  fetch(url: string, init?: { timeoutMs?: number }): Promise<HttpResponse>;
}

export interface GatewayProbe {
  gateway: string;
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface ProbeResult {
  reference: string;
  requestedUrl?: string;
  ok: boolean;
  status?: number;
  contentType?: string;
  body: Uint8Array;
  contentLength?: number;
  truncated: boolean;
  error?: string;
  gateways?: GatewayProbe[];
}

export interface RuleContext {
  /** Parsed metadata when it is a JSON object. Null for arrays, scalars, and failed parses. */
  json: Record<string, unknown> | null;
  /** Parsed metadata before the object check, or the value the caller passed. */
  value: unknown;
  raw: string | null;
  standard: StandardId;
  chain: ChainDefinition | null;
  tokenId?: string;
  contract?: string;
  uri?: string;
  label: string;
  onChain: OnChainFacts | null;
  config: LintConfig;
  offline: boolean;
  fetchError?: string;
  requestedRemote: boolean;
  pathError?: string;
  encodingError?: string;
  parse: {
    ok: boolean;
    error?: string;
    duplicatePaths: string[];
    hasBom: boolean;
    locations: Map<string, SourceLocation>;
  } | null;
  network: NetworkClient;
  probe: (reference: string) => Promise<ProbeResult>;
  report: (finding: { path?: string; message: string; severity?: Severity }) => void;
}

export interface Rule {
  id: string;
  chains: string[];
  standards: string[];
  severity: Severity;
  docs: string;
  needsNetwork: boolean;
  check: (ctx: RuleContext) => void | Promise<void>;
}

export interface RulePack {
  id: string;
  status: "stable" | "beta" | "stub";
  standards: string[];
  rules: Rule[];
}

export interface LintInput {
  json?: unknown;
  raw?: string;
  url?: string;
  uri?: string;
  chain?: string;
  contract?: string;
  tokenId?: string;
  standard?: StandardId;
  onChain?: OnChainFacts;
  label?: string;
  encodingError?: string;
}

export interface ResolvedAsset {
  uri?: string;
  raw?: string;
  json?: unknown;
  standardHint?: StandardId;
  onChain?: OnChainFacts;
  error?: string;
}

export interface ResolveOnChainArgs {
  chain: ChainDefinition;
  contract: string;
  tokenId: string;
  config: LintConfig;
  network: NetworkClient;
}

export type ResolveOnChain = (args: ResolveOnChainArgs) => Promise<ResolvedAsset>;

export interface LintOptions {
  offline?: boolean;
  config?: Partial<Omit<LintConfig, "rules">> & { rules?: LintConfig["rules"] };
  rules?: Rule[];
  network?: NetworkClient;
  resolveOnChain?: ResolveOnChain;
  rpc?: Record<string, string | string[]>;
  maxImageBytes?: number;
  maxThumbnailBytes?: number;
  royaltyWarnAbovePercent?: number;
  timeoutMs?: number;
  ipfsGateways?: string[];
  ruleOverrides?: Record<string, RuleOverride>;
  env?: NodeJS.ProcessEnv;
}

export interface LintSummary {
  errors: number;
  warnings: number;
  infos: number;
}

export interface LintReport {
  target: string;
  standard: StandardId;
  chain: { id: string; name: string; chainId: number | string; caip2: string } | null;
  metadata: unknown;
  findings: Finding[];
  skippedRules: string[];
  summary: LintSummary;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function summarize(findings: Finding[]): LintSummary {
  return {
    errors: findings.filter((finding) => finding.severity === "error").length,
    warnings: findings.filter((finding) => finding.severity === "warn").length,
    infos: findings.filter((finding) => finding.severity === "info").length,
  };
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}
