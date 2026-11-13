import { defineRule, isRecord, metadataUriIssue, ruleDocUrl } from "@nft-lint/core";
import { contentRefs, isInscriptionId } from "./ids.js";

export const requiredFieldsRule = defineRule({
  id: "bitcoin/required-fields",
  chains: ["bitcoin"],
  standards: ["ordinals"],
  severity: "error",
  docs: ruleDocUrl("bitcoin/required-fields"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    if (typeof json.name !== "string" || json.name.trim() === "") {
      ctx.report({
        path: "name",
        message:
          "name must be a non-empty string. Magic Eden and ordinals explorers title the item from it.",
      });
    }
    if ("description" in json && typeof json.description !== "string") {
      ctx.report({ path: "description", message: "description must be a string." });
    } else if (json.description === "") {
      ctx.report({
        path: "description",
        severity: "warn",
        message: "description is empty.",
      });
    }
    const hasImage = typeof json.image === "string" && json.image.trim() !== "";
    const hasId =
      isInscriptionId(json.inscription_id) ||
      isInscriptionId(json.inscription_icon) ||
      isInscriptionId(json.icon_inscription);
    if (
      !hasImage &&
      !isInscriptionId(json.inscription_id) &&
      !isInscriptionId(json.inscription_icon) &&
      !isInscriptionId(json.icon_inscription)
    ) {
      ctx.report({
        path: "image",
        message:
          "Provide image or a valid inscription_id (64 hex characters, then i, then the index). Explorers cannot render the item without one of them.",
      });
    }
    if (hasImage && typeof json.image === "string") {
      const issue = metadataUriIssue(json.image);
      if (issue) ctx.report({ path: "image", message: `image ${issue}` });
      for (const ref of contentRefs(json.image)) {
        if (!isInscriptionId(ref)) {
          ctx.report({
            path: "image",
            message: `image points at /content/${ref}, which is not an inscription id. Use <64 hex>i<index>.`,
          });
        }
      }
    }
    if (!hasId && hasImage && typeof json.image === "string" && json.image.startsWith("http")) {
      ctx.report({
        path: "image",
        severity: "warn",
        message:
          "image is an http(s) URL and there is no inscription id. A hosted file disappears when that server does. Prefer the inscription id.",
      });
    }
    if ("attributes" in json) checkAttributes(ctx, json.attributes);
  },
});

function checkAttributes(ctx: Parameters<typeof requiredFieldsRule.check>[0], attributes: unknown) {
  if (!Array.isArray(attributes)) {
    ctx.report({
      path: "attributes",
      message: "attributes must be an array of {trait_type, value} objects.",
    });
    return;
  }
  attributes.forEach((attribute, index) => {
    const path = `attributes[${index}]`;
    if (!isRecord(attribute)) {
      ctx.report({ path, message: "Each attribute must be an object with trait_type and value." });
      return;
    }
    if (typeof attribute.trait_type !== "string" || attribute.trait_type.trim() === "") {
      ctx.report({ path: `${path}.trait_type`, message: "trait_type must be a non-empty string." });
    }
    if (!("value" in attribute) || attribute.value === "") {
      ctx.report({
        path: `${path}.value`,
        message: "attribute value must be a non-empty string or number.",
      });
    } else if (typeof attribute.value !== "string" && typeof attribute.value !== "number") {
      ctx.report({
        path: `${path}.value`,
        message: "attribute value must be a string or a number.",
      });
    }
  });
}

export const inscriptionIdRule = defineRule({
  id: "bitcoin/inscription-id",
  chains: ["bitcoin"],
  standards: ["ordinals"],
  severity: "error",
  docs: ruleDocUrl("bitcoin/inscription-id"),
  needsNetwork: false,
  check(ctx) {
    const json = ctx.json;
    if (!json) return;
    for (const field of ["inscription_id", "inscription_icon", "parent", "delegate"] as const) {
      if (!(field in json)) continue;
      if (!isInscriptionId(json[field])) {
        ctx.report({
          path: field,
          message: `${field} must be 64 lowercase hex characters, an "i", and an index, such as ${"0".repeat(64)}i0.`,
        });
      }
    }
    checkIdList(ctx, "parents", json.parents);
    checkIdList(ctx, "children", json.children);
    walkContent(ctx, json, "");
  },
});

function checkIdList(
  ctx: Parameters<typeof inscriptionIdRule.check>[0],
  field: string,
  value: unknown,
) {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    ctx.report({ path: field, message: `${field} must be an array of inscription ids.` });
    return;
  }
  value.forEach((item, index) => {
    if (!isInscriptionId(item)) {
      ctx.report({
        path: `${field}[${index}]`,
        message: "Each entry must be an inscription id (64 hex characters, i, index).",
      });
    }
  });
}

function walkContent(
  ctx: Parameters<typeof inscriptionIdRule.check>[0],
  value: unknown,
  path: string,
) {
  if (typeof value === "string") {
    if (path === "image" || path === "inscription_id" || path === "inscription_icon") return;
    for (const ref of contentRefs(value)) {
      if (!isInscriptionId(ref)) {
        ctx.report({
          path: path || "content",
          message: `Recursive /content/${ref} is not an inscription id. Ord endpoints only resolve <64 hex>i<index>.`,
        });
      }
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkContent(ctx, item, `${path}[${index}]`));
    return;
  }
  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      walkContent(ctx, child, path ? `${path}.${key}` : key);
    }
  }
}
