import { ruleDocUrl, type Finding, type LintReport } from "./types.js";
import { isRecord } from "./types.js";

export interface CollectionFile {
  target: string;
  report: LintReport;
  json: unknown;
}

/**
 * Folder-level check: the same trait_type should not mix strings and numbers.
 */
export function collectionFindings(files: CollectionFile[]): Finding[] {
  const kinds = new Map<string, Map<string, string>>();
  for (const file of files) {
    if (!isRecord(file.json) || !Array.isArray(file.json.attributes)) continue;
    const seenInFile = new Set<string>();
    for (const attribute of file.json.attributes) {
      if (!isRecord(attribute) || typeof attribute.trait_type !== "string") continue;
      if (attribute.value === undefined || attribute.value === null) continue;
      const type = typeof attribute.value;
      if (type !== "string" && type !== "number") continue;
      if (seenInFile.has(attribute.trait_type)) continue;
      seenInFile.add(attribute.trait_type);
      const perTrait = kinds.get(attribute.trait_type) ?? new Map<string, string>();
      if (!perTrait.has(type)) perTrait.set(type, file.target);
      kinds.set(attribute.trait_type, perTrait);
    }
  }
  const findings: Finding[] = [];
  for (const [trait, perTrait] of kinds) {
    if (perTrait.size < 2) continue;
    const where = [...perTrait.entries()]
      .map(([type, target]) => `${type} in ${target}`)
      .join(", ");
    findings.push({
      ruleId: "common/trait-type-consistency",
      severity: "warn",
      path: `attributes["${trait}"]`,
      message: `Trait "${trait}" mixes value types across the folder (${where}). Marketplaces group those as different traits.`,
      docs: ruleDocUrl("common/trait-type-consistency"),
    });
  }
  return findings;
}
