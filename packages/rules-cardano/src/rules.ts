import { defineRule, isBech32, isRecord, ruleDocUrl, type RuleContext } from "@nft-lint/core";
import {
  CHUNK_BYTES,
  POLICY_ID,
  byteLength,
  chunksOf,
  cip25Assets,
  cip68Body,
  uriIssue,
} from "./shape.js";

const MIME = /^[\w.+-]+\/[\w.+-]+$/;
const ADDR = /^(?:addr1|addr_test1|stake1|stake_test1)[0-9a-z]+$/;

function checkChunked(
  ctx: RuleContext,
  path: string,
  value: unknown,
  label: string,
): string | null {
  const chunks = chunksOf(value);
  if ("error" in chunks) {
    ctx.report({ path, message: `${label} ${chunks.error}` });
    return null;
  }
  chunks.parts.forEach((part, index) => {
    if (byteLength(part) > CHUNK_BYTES) {
      ctx.report({
        path: chunks.parts.length === 1 ? path : `${path}[${index}]`,
        message: `${label} chunk is ${byteLength(part)} bytes. Cardano metadata strings are limited to ${CHUNK_BYTES} bytes; split the URI into an array.`,
      });
    }
  });
  const issue = uriIssue(chunks.joined);
  if (issue) ctx.report({ path, message: `${label} ${issue}` });
  return chunks.joined;
}

export const cip25AssetRule = defineRule({
  id: "cardano/cip25-asset",
  chains: ["cardano"],
  standards: ["cip-25"],
  severity: "error",
  docs: ruleDocUrl("cardano/cip25-asset"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    if ("721" in json) {
      if (!isRecord(json["721"])) {
        ctx.report({
          path: "721",
          message: "CIP-25 metadata under label 721 must be an object of policy id to assets.",
        });
        return;
      }
      const policies = Object.keys(json["721"]).filter((key) => key !== "version");
      if (policies.length === 0) {
        ctx.report({
          path: "721",
          message: "721 has no policy. Add the 56-character policy id and the asset name.",
        });
      }
      for (const policy of policies) {
        if (!POLICY_ID.test(policy)) {
          ctx.report({
            path: `721.${policy}`,
            message: `Policy id "${policy}" must be 56 hex characters (28 bytes).`,
          });
        }
      }
    }
    const assets = cip25Assets(json);
    if (assets.length === 0) {
      ctx.report({
        path: "721",
        message: "No CIP-25 asset found. Each asset needs name and image.",
      });
      return;
    }
    for (const asset of assets) {
      const prefix = asset.path ? `${asset.path}.` : "";
      if (typeof asset.body.name !== "string" || asset.body.name.trim() === "") {
        ctx.report({
          path: `${prefix}name`,
          message: "CIP-25 name is required and must be a non-empty string.",
        });
      }
      if (!("image" in asset.body)) {
        ctx.report({
          path: `${prefix}image`,
          message:
            "CIP-25 image is required. Use ipfs://, ar://, https://, or data:, split into 64-byte chunks if needed.",
        });
      }
      if (
        "mediaType" in asset.body &&
        (typeof asset.body.mediaType !== "string" || !MIME.test(asset.body.mediaType))
      ) {
        ctx.report({
          path: `${prefix}mediaType`,
          message:
            "mediaType must be a type/subtype string such as image/png. It is optional on the asset and required on each file.",
        });
      } else if (!("mediaType" in asset.body)) {
        ctx.report({
          path: `${prefix}mediaType`,
          severity: "warn",
          message: "mediaType is missing. Wallets guess the image type and often guess wrong.",
        });
      }
      if ("description" in asset.body) {
        const chunks = chunksOf(asset.body.description);
        if ("error" in chunks) {
          ctx.report({ path: `${prefix}description`, message: `description ${chunks.error}` });
        } else {
          chunks.parts.forEach((part, index) => {
            if (byteLength(part) > CHUNK_BYTES) {
              ctx.report({
                path: `${prefix}description[${index}]`,
                message: `description chunk is ${byteLength(part)} bytes. Keep each metadata string within ${CHUNK_BYTES} bytes.`,
              });
            }
          });
        }
      }
    }
  },
});

export const cip25ChunksRule = defineRule({
  id: "cardano/cip25-chunks",
  chains: ["cardano"],
  standards: ["cip-25"],
  severity: "error",
  docs: ruleDocUrl("cardano/cip25-chunks"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json) return;
    for (const asset of cip25Assets(ctx.json)) {
      const prefix = asset.path ? `${asset.path}.` : "";
      if ("image" in asset.body) checkChunked(ctx, `${prefix}image`, asset.body.image, "image");
    }
  },
});

export const cip25FilesRule = defineRule({
  id: "cardano/cip25-files",
  chains: ["cardano"],
  standards: ["cip-25"],
  severity: "error",
  docs: ruleDocUrl("cardano/cip25-files"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json) return;
    for (const asset of cip25Assets(ctx.json)) {
      if (!("files" in asset.body)) continue;
      const prefix = asset.path ? `${asset.path}.` : "";
      if (!Array.isArray(asset.body.files)) {
        ctx.report({
          path: `${prefix}files`,
          message: "files must be an array of {mediaType, src}.",
        });
        continue;
      }
      asset.body.files.forEach((file, index) => {
        const path = `${prefix}files[${index}]`;
        if (!isRecord(file)) {
          ctx.report({ path, message: "Each file must be an object with mediaType and src." });
          return;
        }
        if (typeof file.mediaType !== "string" || !MIME.test(file.mediaType)) {
          ctx.report({
            path: `${path}.mediaType`,
            message: "files[].mediaType is required and must be a type/subtype string.",
          });
        }
        if (!("src" in file)) {
          ctx.report({ path: `${path}.src`, message: "files[].src is required." });
        } else {
          checkChunked(ctx, `${path}.src`, file.src, "src");
        }
        if ("name" in file && typeof file.name !== "string") {
          ctx.report({
            path: `${path}.name`,
            message: "files[].name must be a string when it is set.",
          });
        }
      });
    }
  },
});

export const cip68Rule = defineRule({
  id: "cardano/cip68-datum",
  chains: ["cardano"],
  standards: ["cip-68"],
  severity: "error",
  docs: ruleDocUrl("cardano/cip68-datum"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    const version = json.version;
    if (version !== 1 && version !== 2 && version !== 3 && version !== 4) {
      ctx.report({
        path: "version",
        message:
          "CIP-68 datum version must be an integer from 1 to 4. Version 4 may nest metadata under the 721 map.",
      });
    }
    const { path, body } = cip68Body(json);
    const prefix = path ? `${path}.` : "";
    if (typeof body.name !== "string" || body.name.trim() === "") {
      ctx.report({ path: `${prefix}name`, message: "CIP-68 metadata name is required." });
    }
    if (!("image" in body)) {
      ctx.report({ path: `${prefix}image`, message: "CIP-68 metadata image is required." });
    } else {
      const chunks = chunksOf(body.image);
      if ("error" in chunks) {
        ctx.report({ path: `${prefix}image`, message: `image ${chunks.error}` });
      } else {
        const issue = uriIssue(chunks.joined);
        if (issue) ctx.report({ path: `${prefix}image`, message: `image ${issue}` });
      }
    }
    if (typeof body.mediaType !== "string" || !MIME.test(body.mediaType)) {
      ctx.report({
        path: `${prefix}mediaType`,
        severity: typeof body.mediaType === "string" ? "error" : "warn",
        message: "mediaType should be a type/subtype string such as image/png.",
      });
    }
    if (
      "description" in body &&
      typeof body.description !== "string" &&
      !Array.isArray(body.description)
    ) {
      ctx.report({
        path: `${prefix}description`,
        message: "description must be a string or an array of 64-byte chunks.",
      });
    }
    if (
      "asset_name" in json &&
      typeof json.asset_name === "string" &&
      /^[0-9a-fA-F]+$/.test(json.asset_name)
    ) {
      const label = json.asset_name.toLowerCase();
      const known =
        label.startsWith("000643b0") ||
        label.startsWith("000de140") ||
        label.startsWith("0014df10");
      if (!known) {
        ctx.report({
          path: "asset_name",
          severity: "warn",
          message:
            "CIP-68 asset names carry a CIP-67 label prefix (000643b0 for the reference NFT, 000de140 for the 222 user token). This hex name has neither.",
        });
      }
    }
  },
});

export const cip27Rule = defineRule({
  id: "cardano/cip27-royalties",
  chains: ["cardano"],
  standards: ["cip-25", "cip-68"],
  severity: "error",
  docs: ruleDocUrl("cardano/cip27-royalties"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json || !("777" in json)) return;
    const body = json["777"];
    if (!isRecord(body)) {
      ctx.report({
        path: "777",
        message: "CIP-27 label 777 must be an object with rate and addr.",
      });
      return;
    }
    const rateRaw = body.rate ?? body.pct;
    const rate = typeof rateRaw === "string" ? Number(rateRaw) : rateRaw;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate < 0 || rate > 1) {
      ctx.report({
        path: "777.rate",
        message:
          'rate must be a decimal string from "0" to "1", such as "0.05" for 5%. Legacy pct is still read.',
      });
    } else if (rate * 100 > ctx.config.royaltyWarnAbovePercent) {
      ctx.report({
        path: "777.rate",
        severity: "warn",
        message: `Royalty rate is ${rate * 100}%, above the ${ctx.config.royaltyWarnAbovePercent}% warning line.`,
      });
    }
    if (!("addr" in body)) {
      ctx.report({
        path: "777.addr",
        message: "addr is required. One payment address, as a string or 64-byte chunks.",
      });
      return;
    }
    const chunks = chunksOf(body.addr);
    if ("error" in chunks) {
      ctx.report({ path: "777.addr", message: `addr ${chunks.error}` });
      return;
    }
    chunks.parts.forEach((part, index) => {
      if (byteLength(part) > CHUNK_BYTES) {
        ctx.report({
          path: `777.addr[${index}]`,
          message: `addr chunk is ${byteLength(part)} bytes. Split the address on 64-byte boundaries.`,
        });
      }
    });
    if (!ADDR.test(chunks.joined) || !isBech32(chunks.joined)) {
      ctx.report({
        path: "777.addr",
        message:
          "addr must join into a bech32 address (addr, addr_test, stake, or stake_test) with a valid checksum.",
      });
    }
  },
});
