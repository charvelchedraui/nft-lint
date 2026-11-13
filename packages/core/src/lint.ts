import { getChain, parseChainTarget } from "./chains.js";
import { resolveConfig } from "./config.js";
import { detectStandard, familyOf } from "./detect.js";
import { createNetworkClient } from "./network.js";
import { fetchMetadataDocument, probeReference } from "./probe.js";
import { parseMetadataJson } from "./parse-json.js";
import {
  isRecord,
  summarize,
  type ChainDefinition,
  type Finding,
  type LintInput,
  type LintOptions,
  type LintReport,
  type OnChainFacts,
  type ProbeResult,
  type Rule,
  type RuleContext,
  type StandardId,
} from "./types.js";

interface Prepared {
  label: string;
  raw?: string;
  json?: unknown;
  url?: string;
  uri?: string;
  chain?: ChainDefinition;
  contract?: string;
  tokenId?: string;
  chainTarget: boolean;
  standard?: StandardId;
  onChain?: OnChainFacts;
  pathError?: string;
  unknownChain?: string;
  encodingError?: string;
}

export function ruleApplies(
  rule: Rule,
  chain: ChainDefinition | null,
  standard: StandardId,
): boolean {
  const standardOk = rule.standards.includes("*") || rule.standards.includes(standard);
  if (!standardOk) return false;
  if (rule.chains.includes("*")) return true;
  if (chain && (rule.chains.includes(chain.id) || rule.chains.includes(chain.family))) return true;
  const family = familyOf(standard);
  if (!chain && family) return rule.chains.includes(family);
  return false;
}

export async function lint(
  input: string | LintInput,
  options: LintOptions = {},
): Promise<LintReport> {
  const config = resolveConfig({ ...options, env: options.env ?? process.env });
  const prepared = prepare(input);
  const rules = options.rules ?? [];
  const network =
    options.network ??
    createNetworkClient({
      timeoutMs: config.timeoutMs,
      maxBytes: Math.max(config.maxImageBytes, config.maxThumbnailBytes) + 1,
    });

  let raw = prepared.raw ?? null;
  let json = prepared.json;
  let uri = prepared.uri ?? prepared.url;
  let onChain = prepared.onChain ?? null;
  let fetchError: string | undefined;
  let standardHint = prepared.standard;
  const chain = prepared.chain ?? null;

  if (prepared.chainTarget && !prepared.onChain) {
    if (!chain) {
      fetchError = `Unknown chain "${prepared.unknownChain ?? ""}".`;
    } else if (config.offline) {
      fetchError = `Offline mode cannot read ${prepared.label}. Re-run without --offline.`;
    } else if (!options.resolveOnChain) {
      fetchError =
        "No chain reader is configured. Use the nft-lint CLI or pass resolveOnChain from @nft-lint/fetchers.";
    } else {
      const resolved = await options.resolveOnChain({
        chain,
        contract: prepared.contract ?? "",
        tokenId: prepared.tokenId ?? "",
        config,
        network,
      });
      if (resolved.raw !== undefined) raw = resolved.raw;
      if (resolved.json !== undefined) json = resolved.json;
      if (resolved.uri) uri = resolved.uri;
      if (resolved.onChain) onChain = resolved.onChain;
      if (resolved.standardHint) standardHint = resolved.standardHint;
      if (resolved.error) fetchError = resolved.error;
    }
  } else if (prepared.url && raw == null && json === undefined) {
    if (config.offline) {
      fetchError = `Offline mode cannot fetch ${prepared.url}. Re-run without --offline or pass the JSON.`;
    } else {
      try {
        const document = await fetchMetadataDocument(prepared.url, network, config.ipfsGateways);
        raw = document.raw;
        json = document.json;
        uri = prepared.url;
      } catch (error) {
        fetchError = error instanceof Error ? error.message : String(error);
      }
    }
  }

  const parse = typeof raw === "string" ? parseMetadataJson(raw) : null;
  if (parse?.ok) json = parse.value;

  const standard = detectStandard(json, {
    chain,
    ...(standardHint ? { standard: standardHint } : {}),
    ...(uri ? { uri } : {}),
    onChain,
  });

  const findings: Finding[] = [];
  const cache = new Map<string, Promise<ProbeResult>>();
  const probe = (reference: string) => {
    const hit = cache.get(reference);
    if (hit) return hit;
    const pending = probeReference(reference, network, config);
    cache.set(reference, pending);
    return pending;
  };

  const applicable = rules.filter((rule) => ruleApplies(rule, chain, standard));
  const skippedRules = config.offline
    ? applicable.filter((rule) => rule.needsNetwork).map((rule) => rule.id)
    : [];

  for (const rule of applicable) {
    if (config.offline && rule.needsNetwork) continue;
    const override = config.rules[rule.id];
    if (override?.enabled === false) continue;
    const ctx: RuleContext = {
      json: isRecord(json) ? json : null,
      value: json,
      raw,
      standard,
      chain,
      ...(prepared.tokenId !== undefined ? { tokenId: prepared.tokenId } : {}),
      ...(prepared.contract !== undefined ? { contract: prepared.contract } : {}),
      ...(uri !== undefined ? { uri } : {}),
      label: prepared.label,
      onChain,
      config,
      offline: config.offline,
      ...(fetchError ? { fetchError } : {}),
      requestedRemote: Boolean(prepared.url || prepared.chainTarget),
      ...(prepared.pathError ? { pathError: prepared.pathError } : {}),
      ...(prepared.encodingError ? { encodingError: prepared.encodingError } : {}),
      parse,
      network,
      probe,
      report(partial) {
        const path = partial.path ?? "";
        const location = parse?.locations.get(path);
        findings.push({
          ruleId: rule.id,
          severity: partial.severity ?? override?.severity ?? rule.severity,
          path,
          message: partial.message,
          docs: rule.docs,
          ...(location ? { line: location.line, column: location.column } : {}),
        });
      },
    };
    await rule.check(ctx);
  }

  findings.sort(compareFindings);
  return {
    target: prepared.label,
    standard,
    chain: chain
      ? { id: chain.id, name: chain.name, chainId: chain.chainId, caip2: chain.caip2 }
      : null,
    metadata: isRecord(json) || json !== undefined ? (json ?? null) : null,
    findings,
    skippedRules,
    summary: summarize(findings),
  };
}

function compareFindings(a: Finding, b: Finding): number {
  const rank = { error: 0, warn: 1, info: 2 };
  return (
    rank[a.severity] - rank[b.severity] ||
    a.ruleId.localeCompare(b.ruleId) ||
    a.path.localeCompare(b.path) ||
    a.message.localeCompare(b.message)
  );
}

function prepare(input: string | LintInput): Prepared {
  if (typeof input !== "string") return prepareObject(input);
  const trimmed = input.trim();
  if (!trimmed) {
    return { label: "input", chainTarget: false, pathError: "Empty input." };
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return { label: "json", raw: trimmed, chainTarget: false };
  }
  const chainTarget = parseChainTarget(trimmed);
  if (chainTarget && "unknown" in chainTarget) {
    return {
      label: chainTarget.label,
      chainTarget: true,
      unknownChain: chainTarget.unknown,
    };
  }
  if (chainTarget) {
    return {
      label: chainTarget.label,
      chain: chainTarget.chain,
      contract: chainTarget.contract,
      tokenId: chainTarget.tokenId,
      chainTarget: true,
    };
  }
  if (/^(https?:|ipfs:|ar:)/i.test(trimmed)) {
    return { label: trimmed, url: trimmed, uri: trimmed, chainTarget: false };
  }
  if (trimmed.includes("/") || trimmed.includes("\\") || trimmed.endsWith(".json")) {
    return {
      label: trimmed,
      chainTarget: false,
      pathError: `Refusing to read "${trimmed}" inside the library. Pass the file text, or use the nft-lint CLI.`,
    };
  }
  return { label: "input", raw: trimmed, chainTarget: false };
}

function prepareObject(input: LintInput): Prepared {
  const resolvedChain = input.chain ? getChain(input.chain) : undefined;
  const chainTarget = Boolean(input.chain && input.contract);
  return {
    label:
      input.label ??
      input.url ??
      (chainTarget ? `${input.chain}:${input.contract}:${input.tokenId ?? ""}` : "json"),
    ...(input.raw !== undefined ? { raw: input.raw } : {}),
    ...(input.json !== undefined ? { json: input.json } : {}),
    ...(input.url !== undefined ? { url: input.url, uri: input.uri ?? input.url } : {}),
    ...(input.uri !== undefined ? { uri: input.uri } : {}),
    ...(resolvedChain ? { chain: resolvedChain } : {}),
    ...(input.contract !== undefined ? { contract: input.contract } : {}),
    ...(input.tokenId !== undefined ? { tokenId: input.tokenId } : {}),
    chainTarget,
    ...(input.standard ? { standard: input.standard } : {}),
    ...(input.onChain ? { onChain: input.onChain } : {}),
    ...(input.encodingError ? { encodingError: input.encodingError } : {}),
    ...(input.chain && !resolvedChain ? { unknownChain: input.chain } : {}),
  };
}
