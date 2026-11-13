#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  collectionFindings,
  formatJson,
  formatPretty,
  formatSarif,
  getChain,
  chains,
  type Finding,
  type LintOptions,
  type LintReport,
} from "@nft-lint/core";
import { resolveOnChain } from "@nft-lint/fetchers";
import { defaultRules, lint } from "@nft-lint/preset";
import { Command, Option } from "commander";
import pc from "picocolors";

interface Io {
  stdout: (text: string) => void;
  stderr: (text: string) => void;
  env: NodeJS.ProcessEnv;
  cwd: string;
}

const defaultIo = (): Io => ({
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
  env: process.env,
  cwd: process.cwd(),
});

export async function runCli(argv: string[], io: Io = defaultIo()): Promise<number> {
  const program = new Command();
  program
    .name("nft-lint")
    .description("Lint NFT metadata for 20 chains.")
    .version(version())
    .argument("[targets...]", "JSON file, directory, URL, or chain:contract:tokenId")
    .option("--offline", "Skip rules that need the network")
    .option("--json", "Print a JSON report")
    .option("--sarif", "Print a SARIF 2.1.0 report")
    .option("--quiet", "Print errors only")
    .option("--strict", "Exit 1 when warnings are present")
    .option("-c, --config <file>", "Path to nft-lint.config.json")
    .option("--timeout <ms>", "Network timeout in milliseconds")
    .option("--max-image-bytes <n>", "Warn when an image is larger than this")
    .option("--royalty-warn-above <percent>", "Warn when royalties exceed this percent")
    .option("--chain <id>", "Chain to lint against when the file does not name one")
    .addOption(
      new Option("--rpc <chain=url...>", "Override a chain RPC. Repeat the flag to set several.")
        .argParser(collect)
        .default([]),
    );

  let code = 0;
  program.action(async (targets: string[], options: CliOptions) => {
    if (targets[0] === "chains") {
      io.stdout(`${formatChains()}\n`);
      return;
    }
    if (targets[0] === "rules") {
      io.stdout(`${formatRules()}\n`);
      return;
    }
    if (targets.length === 0) {
      io.stderr(
        "Pass a JSON file, a directory, a metadata URL, or chain:contract:tokenId.\nRun nft-lint --help for flags.\n",
      );
      code = 2;
      return;
    }
    code = await lintTargets(targets, options, io);
  });

  program.exitOverride();
  program.configureOutput({
    writeOut: (text) => io.stdout(text),
    writeErr: (text) => io.stderr(text),
  });

  try {
    await program.parseAsync(argv, { from: "user" });
  } catch (error) {
    const exitCode =
      typeof error === "object" && error && "exitCode" in error ? Number(error.exitCode) : 2;
    const message = error instanceof Error ? error.message : String(error);
    if (message && exitCode !== 0) io.stderr(`${message}\n`);
    return Number.isFinite(exitCode) ? exitCode : 2;
  }
  return code;
}

interface CliOptions {
  offline?: boolean;
  json?: boolean;
  sarif?: boolean;
  quiet?: boolean;
  strict?: boolean;
  config?: string;
  timeout?: string;
  maxImageBytes?: string;
  royaltyWarnAbove?: string;
  rpc?: string[];
  chain?: string;
}

async function lintTargets(targets: string[], options: CliOptions, io: Io): Promise<number> {
  let fileConfig: LintOptions["config"] = {};
  if (options.config) {
    fileConfig = readConfig(resolve(io.cwd, options.config));
  } else {
    const found = findConfig(io.cwd);
    if (found) fileConfig = readConfig(found);
  }
  const lintOptions: LintOptions = {
    rules: defaultRules,
    env: io.env,
    config: fileConfig,
    resolveOnChain,
    ...(options.offline ? { offline: true } : {}),
    ...(options.timeout ? { timeoutMs: Number(options.timeout) } : {}),
    ...(options.maxImageBytes ? { maxImageBytes: Number(options.maxImageBytes) } : {}),
    ...(options.royaltyWarnAbove
      ? { royaltyWarnAbovePercent: Number(options.royaltyWarnAbove) }
      : {}),
    ...(options.rpc?.length ? { rpc: parseRpc(options.rpc) } : {}),
  };

  const reports: LintReport[] = [];
  const collectionFiles: { target: string; report: LintReport; json: unknown }[] = [];
  for (const target of targets) {
    const files = expandTarget(resolve(io.cwd, target), target);
    for (const file of files) {
      const report = await lint(applyChain(file.input, options.chain), lintOptions);
      report.target = file.label;
      reports.push(report);
      collectionFiles.push({ target: file.label, report, json: report.metadata });
    }
  }
  if (collectionFiles.length > 1) {
    const extra = collectionFindings(collectionFiles);
    if (extra.length) {
      reports.push({
        target: "collection",
        standard: "unknown",
        chain: null,
        metadata: null,
        findings: extra,
        skippedRules: [],
        summary: summarize(extra),
      });
    }
  }
  io.stdout(`${render(reports, options, io)}\n`);
  const errors = reports.reduce((sum, report) => sum + report.summary.errors, 0);
  const warnings = reports.reduce((sum, report) => sum + report.summary.warnings, 0);
  if (errors > 0) return 1;
  if (options.strict && warnings > 0) return 1;
  return 0;
}

function render(reports: LintReport[], options: CliOptions, io: Io): string {
  const shown = quietReports(reports, options.quiet);
  if (options.sarif) return formatSarif(shown);
  if (options.json) return formatJson(shown);
  const pretty = formatPretty(shown, { quiet: options.quiet });
  if (io.env.NO_COLOR || !process.stdout.isTTY) return pretty;
  return colorize(pretty);
}

function quietReports(reports: LintReport[], quiet: boolean | undefined): LintReport[] {
  if (!quiet) return reports;
  return reports.map((report) => {
    const findings = report.findings.filter((finding) => finding.severity === "error");
    return { ...report, findings, summary: summarize(findings) };
  });
}

function colorize(text: string): string {
  return text
    .split("\n")
    .map((line) => {
      if (line.startsWith("error")) return pc.red(line);
      if (line.startsWith("warn")) return pc.yellow(line);
      if (line.startsWith("info")) return pc.cyan(line);
      if (line.startsWith("ok")) return pc.green(line);
      return line;
    })
    .join("\n");
}

function applyChain(
  input: string | { raw: string; label: string; encodingError?: string },
  chain: string | undefined,
): string | { raw?: string; label: string; encodingError?: string; chain?: string; url?: string } {
  if (!chain) return input;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (/^(https?:|ipfs:|ar:)/i.test(trimmed)) return { label: trimmed, url: trimmed, chain };
    if (trimmed.startsWith("{") || trimmed.startsWith("["))
      return { raw: trimmed, label: trimmed, chain };
    return input;
  }
  return { ...input, chain };
}

function expandTarget(
  absolute: string,
  label: string,
): { label: string; input: string | { raw: string; label: string; encodingError?: string } }[] {
  let stats;
  try {
    stats = statSync(absolute);
  } catch {
    return [{ label, input: label }];
  }
  if (stats.isDirectory()) {
    return walk(absolute).map((file) => ({ label: file, input: readJsonFile(file) }));
  }
  if (extname(absolute) === ".json") return [{ label, input: readJsonFile(absolute) }];
  return [{ label, input: label }];
}

function walk(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".json") && entry.name !== "nft-lint.config.json")
      files.push(full);
  }
  return files.sort();
}

function readJsonFile(file: string): { raw: string; label: string; encodingError?: string } {
  const bytes = readFileSync(file);
  try {
    return { raw: new TextDecoder("utf-8", { fatal: true }).decode(bytes), label: file };
  } catch {
    return { raw: "", label: file, encodingError: `${file} is not valid UTF-8.` };
  }
}

function readConfig(file: string): LintOptions["config"] {
  const text = readFileSync(file, "utf8");
  return JSON.parse(text) as LintOptions["config"];
}

function findConfig(start: string): string | undefined {
  let dir = start;
  for (let i = 0; i < 8; i += 1) {
    const candidate = join(dir, "nft-lint.config.json");
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      // keep walking
    }
    const parent = resolve(dir, "..");
    if (parent === dir) return undefined;
    dir = parent;
  }
  return undefined;
}

function parseRpc(pairs: string[]): Record<string, string[]> {
  const rpc: Record<string, string[]> = {};
  for (const pair of pairs) {
    const split = pair.indexOf("=");
    if (split <= 0) throw new Error(`--rpc expects chain=url, got "${pair}".`);
    const chain = pair.slice(0, split);
    const url = pair.slice(split + 1);
    const known = getChain(chain);
    rpc[known?.id ?? chain] = [url];
  }
  return rpc;
}

function collect(value: string, previous: string[]): string[] {
  return [...previous, value];
}

function formatChains(): string {
  const lines = ["id           chain id    name"];
  for (const chain of chains) {
    lines.push(`${chain.id.padEnd(12)} ${String(chain.chainId).padEnd(11)} ${chain.name}`);
  }
  return lines.join("\n");
}

function formatRules(): string {
  return defaultRules
    .map(
      (rule) =>
        `${rule.severity.padEnd(5)} ${rule.needsNetwork ? "network" : "offline"}  ${rule.id}`,
    )
    .join("\n");
}

function version(): string {
  const url = new URL("../package.json", import.meta.url);
  if (url.protocol === "file:") {
    const pkg = JSON.parse(readFileSync(url, "utf8")) as { version: string };
    return pkg.version;
  }
  return "0.1.0";
}

function summarize(findings: Finding[]) {
  return {
    errors: findings.filter((finding) => finding.severity === "error").length,
    warnings: findings.filter((finding) => finding.severity === "warn").length,
    infos: findings.filter((finding) => finding.severity === "info").length,
  };
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  runCli(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
