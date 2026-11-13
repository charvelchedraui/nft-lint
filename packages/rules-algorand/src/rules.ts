import {
  defineRule,
  isRecord,
  metadataUriIssue,
  ruleDocUrl,
  type RuleContext,
} from "@nft-lint/core";

const MIME = /^[\w.+-]+\/[\w.+-]+$/;
const INTEGRITY = /^sha256-[A-Za-z0-9+/]+={0,2}$/;
const ARC19 = /^\{ipfscid:(0|1):([a-z0-9-]+):(reserve):sha2-256\}$/;

const ASA_NAME_BYTES = 32;
const ASA_UNIT_BYTES = 8;
const ASA_URL_BYTES = 96;

function requireString(
  ctx: RuleContext,
  path: string,
  value: unknown,
  message: string,
): value is string {
  if (typeof value !== "string" || value.trim() === "") {
    ctx.report({ path, message });
    return false;
  }
  return true;
}

export const arc3FieldsRule = defineRule({
  id: "algorand/arc3-fields",
  chains: ["algorand"],
  standards: ["arc-3", "arc-19"],
  severity: "error",
  docs: ruleDocUrl("algorand/arc3-fields"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    const arc3 =
      "image" in json ||
      "image_mimetype" in json ||
      "image_integrity" in json ||
      "animation_url_mimetype" in json;
    if (!arc3) return;
    if (!requireString(ctx, "name", json.name, "ARC-3 name must be a non-empty string.")) {
      /* reported */
    }
    if (typeof json.description !== "string") {
      ctx.report({ path: "description", message: "ARC-3 description must be a string." });
    }
    if (!requireString(ctx, "image", json.image, "ARC-3 image must be a URI.")) {
      /* reported */
    } else {
      const issue = metadataUriIssue(json.image);
      if (issue) ctx.report({ path: "image", message: `image ${issue}` });
      if (json.image.includes("{ID}")) {
        ctx.report({
          path: "image",
          message: "image uses {ID}. ARC-3 substitutes the lowercase placeholder {id} only.",
        });
      }
    }
    if (typeof json.image_mimetype !== "string" || !json.image_mimetype.startsWith("image/")) {
      ctx.report({
        path: "image_mimetype",
        message:
          'image_mimetype is required with image and must be an image/* type, such as "image/png".',
      });
    }
    for (const field of ["animation_url", "external_url"] as const) {
      if (!(field in json) || json[field] === undefined) continue;
      if (typeof json[field] !== "string") {
        ctx.report({ path: field, message: `${field} must be a string URI.` });
        continue;
      }
      const issue = metadataUriIssue(json[field]);
      if (issue) ctx.report({ path: field, message: `${field} ${issue}` });
      const mimeField = `${field}_mimetype`;
      if (field === "animation_url" && !(mimeField in json)) {
        ctx.report({
          path: mimeField,
          severity: "warn",
          message: "animation_url_mimetype is missing. ARC-3 strongly recommends the MIME type.",
        });
      }
      if (
        mimeField in json &&
        (typeof json[mimeField] !== "string" || !MIME.test(String(json[mimeField])))
      ) {
        ctx.report({ path: mimeField, message: `${mimeField} must be a type/subtype string.` });
      }
    }
    if ("properties" in json && !isRecord(json.properties)) {
      ctx.report({ path: "properties", message: "properties must be an object." });
    }
    if ("extra_metadata" in json) {
      if (typeof json.extra_metadata !== "string" || !isBase64(json.extra_metadata)) {
        ctx.report({
          path: "extra_metadata",
          message:
            "extra_metadata must be base64. It changes how the ASA metadata hash is computed.",
        });
      }
    }
    if ("localization" in json) checkLocalization(ctx, json.localization);
  },
});

export const arc3IntegrityRule = defineRule({
  id: "algorand/arc3-integrity",
  chains: ["algorand"],
  standards: ["arc-3", "arc-19"],
  severity: "error",
  docs: ruleDocUrl("algorand/arc3-integrity"),
  needsNetwork: false,
  async check(ctx) {
    const json = ctx.json;
    if (!json) return;
    for (const field of ["image", "animation_url", "external_url"] as const) {
      const integrity = json[`${field}_integrity`];
      if (integrity === undefined) continue;
      if (typeof json[field] !== "string") {
        ctx.report({
          path: `${field}_integrity`,
          message: `${field}_integrity is set but ${field} is missing. ARC-3 requires the URI next to its digest.`,
        });
        continue;
      }
      if (typeof integrity !== "string" || !INTEGRITY.test(integrity)) {
        ctx.report({
          path: `${field}_integrity`,
          message: `${field}_integrity must be a W3C subresource integrity value: sha256- and base64 of the raw SHA-256 digest.`,
        });
        continue;
      }
      if (ctx.offline || field === "external_url") continue;
      const probe = await ctx.probe(json[field]);
      if (!probe.ok || probe.body.byteLength === 0 || probe.truncated) continue;
      const digest = await sha256Base64(probe.body);
      const expected = integrity.slice("sha256-".length);
      if (digest !== expected) {
        ctx.report({
          path: `${field}_integrity`,
          message: `${field}_integrity does not match the fetched bytes (sha256-${digest}).`,
        });
      }
    }
  },
});

export const arc19Rule = defineRule({
  id: "algorand/arc19-template",
  chains: ["algorand"],
  standards: ["arc-3", "arc-19", "arc-69"],
  severity: "error",
  docs: ruleDocUrl("algorand/arc19-template"),
  needsNetwork: false,
  check(ctx) {
    const candidates = [ctx.uri, ctx.json?.url, ctx.json?.asset_url].filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
    if (candidates.length === 0) return;
    for (const [index, url] of candidates.entries()) {
      const path = index === 0 && url === ctx.uri ? "url" : "url";
      if (url.includes("{ID}") || url.includes("{Id}")) {
        ctx.report({
          path,
          message: `URL uses a bad placeholder. ARC-19 and ARC-3 only substitute the lowercase {id}.`,
        });
      }
      if (!url.includes("template-ipfs://") && !url.includes("{ipfscid:") && !url.includes("{id}"))
        continue;
      if (url.includes("template-ipfs://") || url.includes("{ipfscid:")) {
        const placeholders = url.match(/\{[^}]+\}/g) ?? [];
        if (placeholders.length === 0) {
          ctx.report({
            path,
            message: "template-ipfs URL is missing an {ipfscid:...} placeholder.",
          });
          continue;
        }
        for (const placeholder of placeholders) {
          if (placeholder === "{id}") continue;
          if (!ARC19.test(placeholder)) {
            ctx.report({
              path,
              message: `${placeholder} is not a valid ARC-19 placeholder. Use {ipfscid:<0|1>:<codec>:reserve:sha2-256}, for example {ipfscid:1:raw:reserve:sha2-256}.`,
            });
          }
        }
      }
    }
  },
});

export const arc69Rule = defineRule({
  id: "algorand/arc69-json",
  chains: ["algorand"],
  standards: ["arc-69"],
  severity: "error",
  docs: ruleDocUrl("algorand/arc69-json"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    if (json.standard !== "arc69") {
      ctx.report({
        path: "standard",
        message: 'ARC-69 metadata must set standard to the string "arc69".',
      });
    }
    if (typeof json.description !== "string") {
      ctx.report({ path: "description", message: "description must be a string." });
    }
    if (!("media_url" in json) && !("image" in json)) {
      ctx.report({
        path: "media_url",
        severity: "warn",
        message:
          "ARC-69 has neither media_url nor image. Wallets will not know which file to show.",
      });
    }
    for (const field of ["media_url", "external_url", "image"] as const) {
      if (!(field in json) || json[field] === "") continue;
      if (typeof json[field] !== "string") {
        ctx.report({ path: field, message: `${field} must be a string URI.` });
        continue;
      }
      const issue = metadataUriIssue(json[field]);
      if (issue) ctx.report({ path: field, message: `${field} ${issue}` });
    }
    if ("mime_type" in json && (typeof json.mime_type !== "string" || !MIME.test(json.mime_type))) {
      ctx.report({
        path: "mime_type",
        message: "mime_type must be a type/subtype string such as image/png.",
      });
    }
    if ("properties" in json) {
      if (!isRecord(json.properties) || Array.isArray(json.properties)) {
        ctx.report({
          path: "properties",
          message: "ARC-69 properties must be an object of trait name to value, not an array.",
        });
      }
    }
  },
});

export const asaLimitsRule = defineRule({
  id: "algorand/asa-limits",
  chains: ["algorand"],
  standards: ["arc-3", "arc-19", "arc-69"],
  severity: "error",
  docs: ruleDocUrl("algorand/asa-limits"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    checkBytes(ctx, "asset_name", json.asset_name, ASA_NAME_BYTES, "ASA name");
    checkBytes(
      ctx,
      "unit_name",
      json.unit_name ?? json["unit-name"],
      ASA_UNIT_BYTES,
      "ASA unit name",
    );
    checkBytes(ctx, "url", json.url ?? json.asset_url, ASA_URL_BYTES, "ASA URL");
  },
});

function checkBytes(ctx: RuleContext, path: string, value: unknown, max: number, label: string) {
  if (value === undefined) return;
  if (typeof value !== "string") {
    ctx.report({ path, message: `${label} must be a string.` });
    return;
  }
  const bytes = new TextEncoder().encode(value).length;
  if (bytes > max) {
    ctx.report({
      path,
      message: `${label} is ${bytes} bytes. Algorand allows at most ${max}.`,
    });
  }
}

function checkLocalization(ctx: RuleContext, localization: unknown) {
  if (!isRecord(localization)) {
    ctx.report({
      path: "localization",
      message: "localization must be an object with uri, default, and locales.",
    });
    return;
  }
  if (typeof localization.uri !== "string" || !localization.uri.includes("{locale}")) {
    ctx.report({
      path: "localization.uri",
      message: "localization.uri must be a string containing the {locale} placeholder.",
    });
  }
  if (typeof localization.default !== "string" || localization.default.trim() === "") {
    ctx.report({
      path: "localization.default",
      message: "localization.default must be a locale string.",
    });
  }
  if (!Array.isArray(localization.locales) || localization.locales.length === 0) {
    ctx.report({
      path: "localization.locales",
      message: "localization.locales must be a non-empty array of locales.",
    });
  }
}

async function sha256Base64(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", copy));
  let binary = "";
  for (const byte of digest) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function isBase64(value: string): boolean {
  if (value.length === 0 || value.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+={0,2}$/.test(value);
}
