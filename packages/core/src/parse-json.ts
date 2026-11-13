import type { SourceLocation } from "./types.js";

export interface ParseJsonResult {
  ok: boolean;
  value?: unknown;
  error?: string;
  duplicatePaths: string[];
  hasBom: boolean;
  locations: Map<string, SourceLocation>;
}

export function parseMetadataJson(input: string): ParseJsonResult {
  const hasBom = input.charCodeAt(0) === 0xfeff;
  const text = hasBom ? input.slice(1) : input;
  try {
    const value = JSON.parse(text) as unknown;
    const scanned = scanJson(text);
    return {
      ok: true,
      value,
      duplicatePaths: scanned.duplicatePaths,
      hasBom,
      locations: scanned.locations,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Invalid JSON",
      duplicatePaths: [],
      hasBom,
      locations: new Map(),
    };
  }
}

function scanJson(text: string): {
  duplicatePaths: string[];
  locations: Map<string, SourceLocation>;
} {
  const duplicatePaths: string[] = [];
  const locations = new Map<string, SourceLocation>();
  let index = 0;
  let line = 1;
  let column = 1;

  function position(): SourceLocation {
    return { line, column };
  }

  function bump(char: string) {
    if (char === "\n") {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  function skipWs() {
    while (index < text.length && /\s/.test(text[index]!)) {
      bump(text[index]!);
      index += 1;
    }
  }

  function parseString(): string {
    index += 1;
    column += 1;
    let value = "";
    while (index < text.length) {
      const char = text[index]!;
      if (char === '"') {
        index += 1;
        column += 1;
        return value;
      }
      if (char === "\\") {
        index += 1;
        column += 1;
        const escaped = text[index]!;
        if (escaped === "u") {
          const hex = text.slice(index + 1, index + 5);
          value += String.fromCharCode(Number.parseInt(hex, 16));
          index += 5;
          column += 5;
        } else {
          const map: Record<string, string> = {
            '"': '"',
            "\\": "\\",
            "/": "/",
            b: "\b",
            f: "\f",
            n: "\n",
            r: "\r",
            t: "\t",
          };
          value += map[escaped] ?? escaped;
          index += 1;
          column += 1;
        }
        continue;
      }
      value += char;
      bump(char);
      index += 1;
    }
    return value;
  }

  function parseValue(path: string) {
    skipWs();
    const char = text[index];
    if (char === "{") {
      parseObject(path);
      return;
    }
    if (char === "[") {
      parseArray(path);
      return;
    }
    if (char === '"') {
      if (path && !locations.has(path)) locations.set(path, position());
      parseString();
      return;
    }
    if (path && !locations.has(path)) locations.set(path, position());
    if (char === "t" || char === "f" || char === "n") {
      while (index < text.length && /[a-z]/.test(text[index]!)) {
        bump(text[index]!);
        index += 1;
      }
      return;
    }
    while (index < text.length && /[-0-9.eE+]/.test(text[index]!)) {
      bump(text[index]!);
      index += 1;
    }
  }

  function parseObject(path: string) {
    bump(text[index]!);
    index += 1;
    const seen = new Map<string, number>();
    skipWs();
    if (text[index] === "}") {
      bump("}");
      index += 1;
      return;
    }
    while (index < text.length) {
      skipWs();
      const keyStart = position();
      const key = parseString();
      const child = path ? `${path}.${key}` : key;
      const count = (seen.get(key) ?? 0) + 1;
      seen.set(key, count);
      if (count === 1) locations.set(child, keyStart);
      if (count === 2) duplicatePaths.push(child);
      skipWs();
      if (text[index] === ":") {
        bump(":");
        index += 1;
      }
      parseValue(child);
      skipWs();
      if (text[index] === ",") {
        bump(",");
        index += 1;
        continue;
      }
      if (text[index] === "}") {
        bump("}");
        index += 1;
      }
      break;
    }
  }

  function parseArray(path: string) {
    bump(text[index]!);
    index += 1;
    let item = 0;
    skipWs();
    if (text[index] === "]") {
      bump("]");
      index += 1;
      return;
    }
    while (index < text.length) {
      parseValue(`${path}[${item}]`);
      item += 1;
      skipWs();
      if (text[index] === ",") {
        bump(",");
        index += 1;
        continue;
      }
      if (text[index] === "]") {
        bump("]");
        index += 1;
      }
      break;
    }
  }

  parseValue("");
  return { duplicatePaths, locations };
}
