import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { lint } from "@nft-lint/preset";
import type { LintInput, NetworkClient } from "@nft-lint/core";

interface MockResponse {
  status: number;
  bodyBase64?: string;
  contentType?: string;
  contentLength?: number;
}

interface Fixture {
  rule: string;
  kind: "pass" | "fail";
  offline?: boolean;
  input: LintInput;
  config?: {
    ipfsGateways?: string[];
    rules?: Record<string, { enabled?: boolean }>;
  };
  network?: Record<string, MockResponse>;
  rules?: Record<string, { enabled?: boolean }>;
}

const files = readdirSync("fixtures")
  .filter((file) => file.endsWith(".json"))
  .sort();

function mockNetwork(map: Record<string, MockResponse>): NetworkClient {
  return {
    async fetch(url) {
      const spec = map[url];
      if (!spec) throw new Error(`Unexpected fetch ${url}`);
      const body = Buffer.from(spec.bodyBase64 ?? "", "base64");
      const headers: Record<string, string> = {};
      if (spec.contentType) headers["content-type"] = spec.contentType;
      if (spec.contentLength !== undefined) headers["content-length"] = String(spec.contentLength);
      return {
        ok: spec.status >= 200 && spec.status < 300,
        status: spec.status,
        headers,
        body,
        finalUrl: url,
        truncated: false,
      };
    },
  };
}

describe("fixtures", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", () => {
      throw new Error("fixture tried to use the real network");
    });
  });

  if (files.length === 0) {
    it("finds fixture files", () => {
      expect(files.length).toBeGreaterThan(0);
    });
  }

  for (const file of files) {
    it(file, async () => {
      const fixture = JSON.parse(readFileSync(join("fixtures", file), "utf8")) as Fixture;
      const report = await lint(fixture.input, {
        env: {},
        offline: fixture.network ? false : (fixture.offline ?? true),
        ...(fixture.config ? { config: fixture.config } : {}),
        ...(fixture.rules ? { ruleOverrides: fixture.rules } : {}),
        ...(fixture.network ? { network: mockNetwork(fixture.network) } : {}),
      });
      const ids = report.findings.map((finding) => finding.ruleId);
      if (fixture.kind === "pass") {
        expect(ids, JSON.stringify(report.findings, null, 2)).not.toContain(fixture.rule);
        expect(report.summary.errors, JSON.stringify(report.findings, null, 2)).toBe(0);
        expect(report.findings, JSON.stringify(report.findings, null, 2)).toEqual([]);
      } else {
        expect(ids, JSON.stringify(report.findings, null, 2)).toContain(fixture.rule);
      }
      expect(
        report.findings.map((finding) => ({
          ruleId: finding.ruleId,
          severity: finding.severity,
          path: finding.path,
          message: finding.message,
        })),
      ).toMatchSnapshot();
    });
  }
});
