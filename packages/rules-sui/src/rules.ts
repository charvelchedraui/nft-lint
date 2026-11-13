import {
  defineRule,
  isRecord,
  metadataUriIssue,
  ruleDocUrl,
  type RuleContext,
} from "@nft-lint/core";

const SUI_ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;

export function displayMap(json: Record<string, unknown>): Record<string, unknown> | null {
  if (isRecord(json.display) && isRecord(json.display.data)) return json.display.data;
  const contents = isRecord(json.contents) ? json.contents : null;
  const fields = contents && isRecord(contents.fields) ? contents.fields : null;
  const keys = fields && Array.isArray(fields.keys) ? fields.keys : null;
  const values = fields && Array.isArray(fields.values) ? fields.values : null;
  if (keys && values) {
    const map: Record<string, unknown> = {};
    keys.forEach((key, index) => {
      if (typeof key === "string") map[key] = values[index];
    });
    return map;
  }
  if (typeof json.name === "string" || typeof json.image_url === "string") return json;
  return null;
}

function checkUrl(ctx: RuleContext, path: string, value: unknown, required: boolean) {
  if (value === undefined || value === "") {
    if (required) ctx.report({ path, message: `${path} is required.` });
    return;
  }
  if (typeof value !== "string") {
    ctx.report({ path, message: `${path} must be a string.` });
    return;
  }
  if (unresolvedDisplayExpressions(value).length > 0) return;
  const issue = metadataUriIssue(value);
  if (issue) ctx.report({ path, message: `${path} ${issue}` });
}

export const displayFieldsRule = defineRule({
  id: "sui/display-fields",
  chains: ["sui"],
  standards: ["sui-display"],
  severity: "error",
  docs: ruleDocUrl("sui/display-fields"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json) return;
    const map = displayMap(ctx.json);
    if (!map) {
      ctx.report({
        path: "name",
        message:
          "Sui Display needs name, description, and image_url. Wallets show raw object fields without them.",
      });
      return;
    }
    for (const field of ["name", "description", "image_url"] as const) {
      if (typeof map[field] !== "string" || map[field].trim() === "") {
        ctx.report({
          path: field,
          severity: "warn",
          message: `${field} is empty. Display lists it as a suggested field; wallets fall back to raw object data.`,
        });
      }
    }
  },
});

export const templatesRule = defineRule({
  id: "sui/templates",
  chains: ["sui"],
  standards: ["sui-display"],
  severity: "warn",
  docs: ruleDocUrl("sui/templates"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json) return;
    const map = displayMap(ctx.json);
    if (!map) return;
    for (const [key, value] of Object.entries(map)) {
      if (typeof value !== "string") continue;
      for (const expression of unresolvedDisplayExpressions(value)) {
        ctx.report({
          path: key,
          message: `${key} still contains a Display expression {${expression}}. A rendered object should have substituted it. {{ and }} are literal braces and are ignored.`,
        });
      }
    }
  },
});

/**
 * Display V2 expressions still present after `{{` and `}}` are read as literal braces.
 * `{field}`, `{field.nested}`, `{field | 'default'}`, and `{field:hex}` all count.
 */
export function unresolvedDisplayExpressions(value: string): string[] {
  const stripped = value.replaceAll("{{", "\u0000").replaceAll("}}", "\u0001");
  return [...stripped.matchAll(/\{([^{}]*)\}/g)].map((match) => (match[1] ?? "").trim());
}

export const urlsRule = defineRule({
  id: "sui/urls",
  chains: ["sui"],
  standards: ["sui-display"],
  severity: "error",
  docs: ruleDocUrl("sui/urls"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json) return;
    const map = displayMap(ctx.json);
    if (!map) return;
    checkUrl(ctx, "image_url", map.image_url, false);
    for (const field of ["thumbnail_url", "project_url", "link"] as const) {
      if (field in map) checkUrl(ctx, field, map[field], false);
    }
  },
});

export const kioskRule = defineRule({
  id: "sui/kiosk",
  chains: ["sui"],
  standards: ["sui-display"],
  severity: "error",
  docs: ruleDocUrl("sui/kiosk"),
  needsNetwork: false,
  check(ctx) {
    if (!ctx.json) return;
    const id =
      (typeof ctx.json.kiosk_id === "string" && ctx.json.kiosk_id) ||
      (typeof ctx.json.kiosk === "string" && ctx.json.kiosk) ||
      (isRecord(ctx.json.owner) && typeof ctx.json.owner.ObjectOwner === "string"
        ? ctx.json.owner.ObjectOwner
        : "");
    if (!id) return;
    if (!SUI_ADDRESS.test(id)) {
      ctx.report({
        path: "kiosk_id",
        message: "Kiosk id must be a Sui address: 0x and 1 to 64 hex characters.",
      });
      return;
    }
    if (isRecord(ctx.json.owner) && "ObjectOwner" in ctx.json.owner) {
      ctx.report({
        path: "owner",
        severity: "info",
        message:
          "This object is owned by another object (usually a Kiosk). A wallet transfer will fail until it leaves the Kiosk.",
      });
    }
  },
});
