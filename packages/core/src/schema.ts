import { Ajv, type ErrorObject } from "ajv";

const ajv = new Ajv({ allErrors: true, strict: false });

export interface SchemaIssue {
  path: string;
  message: string;
}

export function schemaIssues(schema: object, data: unknown): SchemaIssue[] {
  const validate = ajv.compile(schema);
  if (validate(data)) return [];
  return (validate.errors ?? []).map(humanize);
}

function humanize(error: ErrorObject): SchemaIssue {
  const path = pointerToPath(error.instancePath);
  if (error.keyword === "required") {
    const missing = String(error.params.missingProperty ?? "");
    const full = path ? `${path}.${missing}` : missing;
    return { path: full, message: `Missing required field "${missing}".` };
  }
  if (error.keyword === "type") {
    const label = path || "value";
    return { path, message: `${label} must be a ${String(error.params.type)}.` };
  }
  if (error.keyword === "minLength") {
    const label = path || "value";
    return { path, message: `${label} must not be empty.` };
  }
  if (error.keyword === "enum") {
    const allowed = (error.params.allowedValues as unknown[] | undefined)?.join(", ");
    return { path, message: `${path || "value"} must be one of ${allowed}.` };
  }
  return { path, message: error.message ?? "Does not match the metadata schema." };
}

function pointerToPath(pointer: string): string {
  if (!pointer) return "";
  const parts = pointer
    .split("/")
    .slice(1)
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"));
  let out = "";
  for (const part of parts) {
    if (/^\d+$/.test(part)) out += `[${part}]`;
    else out += out ? `.${part}` : part;
  }
  return out;
}

export const ercMetadataSchema = {
  $id: "https://github.com/charvelchedraui/nft-lint/blob/main/schemas/erc-metadata.schema.json",
  title: "ERC-721 / ERC-1155 metadata JSON",
  type: "object",
  additionalProperties: true,
  required: ["name", "description", "image"],
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string" },
    image: { type: "string", minLength: 1 },
    external_url: { type: "string" },
    animation_url: { type: "string" },
    youtube_url: { type: "string" },
    background_color: { type: "string" },
  },
} as const;

export const metaplexMetadataSchema = {
  $id: "https://github.com/charvelchedraui/nft-lint/blob/main/schemas/metaplex-metadata.schema.json",
  title: "Metaplex token metadata JSON",
  type: "object",
  additionalProperties: true,
  required: ["name", "symbol", "description", "image", "attributes", "properties"],
  properties: {
    name: { type: "string", minLength: 1 },
    symbol: { type: "string" },
    description: { type: "string" },
    image: { type: "string", minLength: 1 },
    animation_url: { type: "string" },
    external_url: { type: "string" },
    attributes: { type: "array" },
    properties: {
      type: "object",
      additionalProperties: true,
      required: ["files", "category"],
      properties: {
        files: { type: "array" },
        category: { type: "string", minLength: 1 },
      },
    },
  },
} as const;

export const openseaAttributeSchema = {
  $id: "https://github.com/charvelchedraui/nft-lint/blob/main/schemas/opensea-attribute.schema.json",
  title: "OpenSea-style attribute",
  type: "object",
  additionalProperties: true,
  required: ["trait_type", "value"],
  properties: {
    trait_type: { type: "string", minLength: 1 },
    value: { type: ["string", "number"] },
    display_type: { enum: ["number", "boost_number", "boost_percentage", "date"] },
  },
} as const;
