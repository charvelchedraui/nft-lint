import { VERSION, type Finding, type LintReport } from "./types.js";

export function formatSarif(reports: LintReport[]): string {
  const rules = new Map<string, { id: string; helpUri: string }>();
  const results = [];
  for (const report of reports) {
    for (const finding of report.findings) {
      rules.set(finding.ruleId, { id: finding.ruleId, helpUri: finding.docs });
      results.push(result(report.target, finding));
    }
  }
  return JSON.stringify(
    {
      $schema: "https://json.schemastore.org/sarif-2.1.0.json",
      version: "2.1.0",
      runs: [
        {
          tool: {
            driver: {
              name: "nft-lint",
              version: VERSION,
              informationUri: "https://github.com/charvelchedraui/nft-lint",
              rules: [...rules.values()].map((rule) => ({
                id: rule.id,
                helpUri: rule.helpUri,
                help: { text: `See ${rule.helpUri}` },
              })),
            },
          },
          results,
        },
      ],
    },
    null,
    2,
  );
}

function result(target: string, finding: Finding) {
  return {
    ruleId: finding.ruleId,
    level:
      finding.severity === "error" ? "error" : finding.severity === "warn" ? "warning" : "note",
    message: { text: finding.message },
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: target },
          region: {
            startLine: finding.line && finding.line > 0 ? finding.line : 1,
            ...(finding.column && finding.column > 0 ? { startColumn: finding.column } : {}),
          },
        },
        logicalLocations: [{ fullyQualifiedName: finding.path || target }],
      },
    ],
  };
}
