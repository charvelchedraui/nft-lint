import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { defaultRules } from "@nft-lint/preset";
import { ercMetadataSchema, metaplexMetadataSchema, openseaAttributeSchema } from "@nft-lint/core";

const chainPacks = [
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
];

describe("rule registry", () => {
  it("gives every default rule a doc and a pass and fail fixture", () => {
    const fixtures = readdirSync("fixtures").filter((file) => file.endsWith(".json"));
    for (const rule of defaultRules) {
      expect(existsSync(join("docs/rules", `${rule.id}.md`)), rule.id).toBe(true);
      const related = fixtures.filter((file) => file.startsWith(rule.id.replaceAll("/", "-")));
      expect(
        related.some((file) => file.endsWith("-pass.json")),
        rule.id,
      ).toBe(true);
      expect(
        related.some((file) => file.endsWith("-fail.json")),
        rule.id,
      ).toBe(true);
    }
  });

  it("keeps the published json schemas in sync with the engine", () => {
    expect(JSON.parse(readFileSync("schemas/erc-metadata.schema.json", "utf8"))).toEqual(
      ercMetadataSchema,
    );
    expect(JSON.parse(readFileSync("schemas/metaplex-metadata.schema.json", "utf8"))).toEqual(
      metaplexMetadataSchema,
    );
    expect(JSON.parse(readFileSync("schemas/opensea-attribute.schema.json", "utf8"))).toEqual(
      openseaAttributeSchema,
    );
  });

  it("ships a stable rule pack for each of the 10 later chains", async () => {
    for (const id of chainPacks) {
      const mod = (await import(`../packages/rules-${id}/src/index.ts`)) as {
        pack: { id: string; status: string; rules: { id: string }[] };
      };
      expect(mod.pack.id).toBe(id);
      expect(mod.pack.status).toBe("stable");
      expect(mod.pack.rules.length).toBeGreaterThan(0);
      expect(existsSync(join("packages", `rules-${id}`, "README.md"))).toBe(true);
      for (const rule of mod.pack.rules) {
        expect(defaultRules.some((item) => item.id === rule.id)).toBe(true);
      }
    }
  });
});
