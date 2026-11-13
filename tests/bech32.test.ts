import { describe, expect, it } from "vitest";
import { isBech32 } from "@nft-lint/core";
import { unresolvedDisplayExpressions } from "@nft-lint/rules-sui";

describe("bech32 checksums", () => {
  it("accepts a stars address and an addr address with valid checksums", () => {
    expect(isBech32("stars1qqgjyv6y24n80zye42aueh0wluqpzg3n0zr0cv", "stars")).toBe(true);
    expect(
      isBech32("cosmos1ysyj6sg544xlss69tdm58vj3n8y8tgnjed0sxzwgz6hyqhx3r86sqmwjvh", "cosmos"),
    ).toBe(true);
    expect(
      isBech32("addr1qqgjyv6y24n80zye42aueh0wluqpzg3ng32kvaugnx4thnxaamlsuvpt9u", "addr"),
    ).toBe(true);
  });

  it("rejects a prefix that only looks right", () => {
    expect(isBech32("stars1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq", "stars")).toBe(false);
    expect(isBech32("addr1qaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "addr")).toBe(false);
  });
});

describe("sui display expressions", () => {
  it("ignores literal doubled braces and flags leftover expressions", () => {
    expect(unresolvedDisplayExpressions("Use {{braces}} in text")).toEqual([]);
    expect(unresolvedDisplayExpressions("ipfs://cid/{image_id}.png")).toEqual(["image_id"]);
    expect(unresolvedDisplayExpressions("{name | 'fallback'}")).toEqual(["name | 'fallback'"]);
    expect(unresolvedDisplayExpressions("{amount:hex}")).toEqual(["amount:hex"]);
  });
});
