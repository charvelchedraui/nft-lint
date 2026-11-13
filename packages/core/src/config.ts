import type { LintConfig, LintOptions } from "./types.js";
import { chains } from "./chains.js";

export const DEFAULT_IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
];

export const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const DEFAULT_MAX_THUMBNAIL_BYTES = 1 * 1024 * 1024;
export const DEFAULT_TIMEOUT_MS = 15_000;
export const DEFAULT_ROYALTY_WARN_ABOVE = 10;

export function defaultConfig(): LintConfig {
  const rpc: Record<string, string[]> = {};
  for (const chain of chains) rpc[chain.id] = [...chain.rpc];
  return {
    offline: false,
    maxImageBytes: DEFAULT_MAX_IMAGE_BYTES,
    maxThumbnailBytes: DEFAULT_MAX_THUMBNAIL_BYTES,
    royaltyWarnAbovePercent: DEFAULT_ROYALTY_WARN_ABOVE,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    ipfsGateways: [...DEFAULT_IPFS_GATEWAYS],
    rpc,
    rules: {},
  };
}

function asStringList(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const list = Array.isArray(value) ? value : value.split(",");
  return list.map((entry) => entry.trim()).filter(Boolean);
}

function envFlag(env: NodeJS.ProcessEnv, name: string): boolean | undefined {
  const value = env[name];
  if (value === undefined || value === "") return undefined;
  return value === "1" || value.toLowerCase() === "true";
}

function envNumber(env: NodeJS.ProcessEnv, name: string): number | undefined {
  const value = env[name];
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function rpcFromEnv(env: NodeJS.ProcessEnv): Record<string, string[]> {
  const rpc: Record<string, string[]> = {};
  for (const chain of chains) {
    const key = `NFT_LINT_RPC_${chain.id.toUpperCase().replace(/-/g, "_")}`;
    const list = asStringList(env[key]);
    if (list?.length) rpc[chain.id] = list;
  }
  return rpc;
}

function mergeRpc(
  base: Record<string, string[]>,
  override: Record<string, string | string[]> | undefined,
): Record<string, string[]> {
  if (!override) return base;
  const next = { ...base };
  for (const [chain, value] of Object.entries(override)) {
    const list = asStringList(value);
    if (list?.length) next[chain] = list;
  }
  return next;
}

export function resolveConfig(options: LintOptions = {}): LintConfig {
  const env = options.env ?? {};
  const file = options.config ?? {};
  const defaults = defaultConfig();
  const envOffline = envFlag(env, "NFT_LINT_OFFLINE");
  const envGateways = asStringList(env.NFT_LINT_IPFS_GATEWAYS);

  return {
    offline: options.offline ?? envOffline ?? file.offline ?? defaults.offline,
    maxImageBytes:
      options.maxImageBytes ??
      envNumber(env, "NFT_LINT_MAX_IMAGE_BYTES") ??
      file.maxImageBytes ??
      defaults.maxImageBytes,
    maxThumbnailBytes:
      options.maxThumbnailBytes ??
      envNumber(env, "NFT_LINT_MAX_THUMBNAIL_BYTES") ??
      file.maxThumbnailBytes ??
      defaults.maxThumbnailBytes,
    royaltyWarnAbovePercent:
      options.royaltyWarnAbovePercent ??
      envNumber(env, "NFT_LINT_ROYALTY_WARN_ABOVE") ??
      file.royaltyWarnAbovePercent ??
      defaults.royaltyWarnAbovePercent,
    timeoutMs:
      options.timeoutMs ??
      envNumber(env, "NFT_LINT_TIMEOUT_MS") ??
      file.timeoutMs ??
      defaults.timeoutMs,
    ipfsGateways: options.ipfsGateways ?? envGateways ?? file.ipfsGateways ?? defaults.ipfsGateways,
    rpc: mergeRpc(mergeRpc(mergeRpc(defaults.rpc, file.rpc), rpcFromEnv(env)), options.rpc),
    rules: { ...file.rules, ...options.ruleOverrides },
  };
}
