import type { Finding, LintReport } from "./types.js";

export function formatPretty(reports: LintReport[], options?: { quiet?: boolean }): string {
  return reports
    .map((report) => formatOne(report, options?.quiet ?? false))
    .filter(Boolean)
    .join("\n\n");
}

function formatOne(report: LintReport, quiet: boolean): string {
  const findings = quiet
    ? report.findings.filter((finding) => finding.severity === "error")
    : report.findings;
  const lines = [
    `${report.target}`,
    `standard  ${report.standard}${report.chain ? `   chain  ${report.chain.name} (${report.chain.chainId})` : ""}`,
  ];
  if (report.skippedRules.length && !quiet) {
    lines.push(`offline   skipped ${report.skippedRules.join(", ")}`);
  }
  if (findings.length === 0) {
    lines.push("ok        no findings");
  }
  for (const finding of findings) {
    const where = finding.path
      ? `${finding.path}${finding.line ? `:${finding.line}` : ""}`
      : finding.line
        ? `line ${finding.line}`
        : "";
    lines.push(`${finding.severity.padEnd(9)} ${finding.ruleId}${where ? `  ${where}` : ""}`);
    lines.push(`          ${finding.message}`);
    lines.push(`          ${finding.docs}`);
  }
  const summary = quiet
    ? `${findings.length} error${findings.length === 1 ? "" : "s"}`
    : `${report.summary.errors} error${report.summary.errors === 1 ? "" : "s"}, ${report.summary.warnings} warning${report.summary.warnings === 1 ? "" : "s"}, ${report.summary.infos} info${report.summary.infos === 1 ? "" : "s"}`;
  lines.push(summary);
  return lines.join("\n");
}

export function formatMarkdown(report: LintReport): string {
  const sections: [string, Finding[]][] = [
    ["Errors", report.findings.filter((finding) => finding.severity === "error")],
    ["Warnings", report.findings.filter((finding) => finding.severity === "warn")],
    ["Info", report.findings.filter((finding) => finding.severity === "info")],
  ];
  const lines = [
    "# NFT Lint report",
    "",
    `Target: \`${report.target}\``,
    `Standard: ${report.standard}`,
  ];
  if (report.chain) lines.push(`Chain: ${report.chain.name} (${report.chain.caip2})`);
  lines.push("");
  for (const [title, findings] of sections) {
    if (findings.length === 0) continue;
    lines.push(`## ${title}`, "");
    for (const finding of findings) {
      const path = finding.path ? ` \`${finding.path}\`` : "";
      lines.push(`- **${finding.ruleId}**${path} — ${finding.message}`);
      lines.push(`  [Docs](${finding.docs})`);
    }
    lines.push("");
  }
  if (report.findings.length === 0) {
    lines.push("No findings.", "");
  }
  lines.push(
    `${report.summary.errors} error${report.summary.errors === 1 ? "" : "s"}, ${report.summary.warnings} warning${report.summary.warnings === 1 ? "" : "s"}, ${report.summary.infos} info${report.summary.infos === 1 ? "" : "s"}.`,
  );
  return lines.join("\n");
}

export function formatJson(reports: LintReport[]): string {
  const summary = reports.reduce(
    (total, report) => ({
      errors: total.errors + report.summary.errors,
      warnings: total.warnings + report.summary.warnings,
      infos: total.infos + report.summary.infos,
    }),
    { errors: 0, warnings: 0, infos: 0 },
  );
  return JSON.stringify({ summary, results: reports }, null, 2);
}
