import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "nft-lint";

const image = "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi/1.png";

function io() {
  const out: string[] = [];
  const err: string[] = [];
  return {
    out,
    err,
    streams: {
      stdout: (text: string) => out.push(text),
      stderr: (text: string) => err.push(text),
      env: { NO_COLOR: "1" } as NodeJS.ProcessEnv,
      cwd: tmpdir(),
    },
  };
}

describe("cli", () => {
  it("lists chains and rules without touching the network", async () => {
    const chains = io();
    expect(await runCli(["chains"], chains.streams)).toBe(0);
    expect(chains.out.join("")).toContain("robinhood");
    expect(chains.out.join("")).toContain("4663");
    const rules = io();
    expect(await runCli(["rules"], rules.streams)).toBe(0);
    expect(rules.out.join("")).toContain("evm/eip2981");
    expect(rules.out.join("")).toContain("solana/core-plugins");
  });

  it("exits 1 for a broken file and 0 for a valid one", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nft-lint-"));
    const broken = join(dir, "broken.json");
    const valid = join(dir, "valid.json");
    writeFileSync(
      broken,
      JSON.stringify({
        name: "Glass Finch",
        description: "Kiln-fired glass bird.",
        external_url: "https://gallery.example/finch/1",
      }),
    );
    writeFileSync(
      valid,
      JSON.stringify({
        name: "Glass Finch",
        description: "Kiln-fired glass bird.",
        image,
        external_url: "https://gallery.example/finch/1",
        background_color: "e8dcc8",
        attributes: [{ trait_type: "Plumage", value: "Amber" }],
      }),
    );
    const bad = io();
    bad.streams.cwd = dir;
    expect(await runCli([broken, "--offline", "--json"], bad.streams)).toBe(1);
    expect(bad.out.join("")).toContain("evm/required-fields");

    const good = io();
    good.streams.cwd = dir;
    expect(await runCli([valid, "--offline"], good.streams)).toBe(0);
    expect(good.out.join("")).toContain("no findings");
  });

  it("supports --quiet, --strict, and --sarif", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nft-lint-"));
    const file = join(dir, "color.json");
    writeFileSync(
      file,
      JSON.stringify({
        name: "Glass Finch",
        description: "Kiln-fired glass bird.",
        image,
        external_url: "http://gallery.example/finch/1",
        background_color: "e8dcc8",
        attributes: [{ trait_type: "Plumage", value: "Amber" }],
      }),
    );
    const quiet = io();
    quiet.streams.cwd = dir;
    expect(await runCli([file, "--offline", "--quiet"], quiet.streams)).toBe(0);
    expect(quiet.out.join("")).not.toContain("external_url");

    const strict = io();
    strict.streams.cwd = dir;
    expect(await runCli([file, "--offline", "--strict"], strict.streams)).toBe(1);

    const sarif = io();
    sarif.streams.cwd = dir;
    expect(await runCli([file, "--offline", "--sarif"], sarif.streams)).toBe(0);
    const parsed = JSON.parse(sarif.out.join("")) as { version: string };
    expect(parsed.version).toBe("2.1.0");
  });

  it("warns when a folder mixes trait value types", async () => {
    const dir = mkdtempSync(join(tmpdir(), "nft-lint-"));
    const token = (value: string | number) => ({
      name: "Glass Finch",
      description: "Kiln-fired glass bird.",
      image,
      attributes: [{ trait_type: "Edition", value }],
    });
    writeFileSync(join(dir, "a.json"), JSON.stringify(token("one")));
    writeFileSync(join(dir, "b.json"), JSON.stringify(token(2)));
    const report = io();
    report.streams.cwd = dir;
    const code = await runCli([dir, "--offline", "--json"], report.streams);
    expect(code).toBe(0);
    expect(report.out.join("")).toContain("common/trait-type-consistency");
  });

  it("exits 2 when there is no target", async () => {
    const captured = io();
    expect(await runCli([], captured.streams)).toBe(2);
  });
});
