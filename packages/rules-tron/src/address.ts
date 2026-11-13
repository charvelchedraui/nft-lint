const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

/** Base58Check mainnet address: 0x41 prefix, 20-byte account, 4-byte checksum. */
export async function isTronAddress(value: string): Promise<boolean> {
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value)) return false;
  const bytes = base58Decode(value);
  if (!bytes || bytes.length !== 25 || bytes[0] !== 0x41) return false;
  const first = await sha256(bytes.subarray(0, 21));
  const second = await sha256(first);
  for (let i = 0; i < 4; i += 1) {
    if (second[i] !== bytes[21 + i]) return false;
  }
  return true;
}

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", copy));
}

function base58Decode(value: string): Uint8Array | null {
  let n = 0n;
  for (const char of value) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) return null;
    n = n * 58n + BigInt(digit);
  }
  let hex = n.toString(16);
  if (hex.length % 2) hex = `0${hex}`;
  const zeros = value.match(/^1*/)?.[0].length ?? 0;
  const body = new Uint8Array(hex.length / 2);
  for (let i = 0; i < body.length; i += 1) {
    body[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  const out = new Uint8Array(zeros + body.length);
  out.set(body, zeros);
  return out;
}
