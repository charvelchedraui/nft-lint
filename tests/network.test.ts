import { describe, expect, it } from "vitest";
import { lint } from "@nft-lint/preset";

const enabled = process.env.NFT_LINT_NETWORK === "1";

describe.skipIf(!enabled)("opt-in network", () => {
  it("fetches a public https document and reports the host policy", async () => {
    const report = await lint(
      {
        json: {
          name: "Example",
          description: "Fetched during the opt-in network test.",
          image: "https://example.com/",
        },
      },
      { env: {}, offline: false, timeoutMs: 20_000 },
    );
    expect(report.findings.some((finding) => finding.ruleId === "media/host-policy")).toBe(true);
    expect(
      report.findings.some(
        (finding) => finding.ruleId === "media/reachable" || finding.ruleId === "media/mime",
      ),
    ).toBe(true);
  });
});
