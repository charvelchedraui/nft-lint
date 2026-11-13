const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
  let chk = 1;
  for (const value of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    for (let i = 0; i < 5; i += 1) {
      if ((top >> i) & 1) chk ^= GENERATORS[i]!;
    }
  }
  return chk;
}

function expandHrp(hrp: string): number[] {
  const out: number[] = [];
  for (const char of hrp) out.push(char.charCodeAt(0) >> 5);
  out.push(0);
  for (const char of hrp) out.push(char.charCodeAt(0) & 31);
  return out;
}

/** BIP-173 bech32 checksum. `hrp` limits the human-readable part, for example `stars` or `addr`. */
export function isBech32(value: string, hrp?: string): boolean {
  if (value.length < 8 || value !== value.toLowerCase() || value.includes("1") === false)
    return false;
  const split = value.lastIndexOf("1");
  if (split < 1 || split + 7 > value.length) return false;
  const part = value.slice(0, split);
  if (hrp && part !== hrp) return false;
  if (!/^[a-z0-9]+$/.test(part)) return false;
  const data: number[] = [];
  for (const char of value.slice(split + 1)) {
    const digit = CHARSET.indexOf(char);
    if (digit < 0) return false;
    data.push(digit);
  }
  return polymod(expandHrp(part).concat(data)) === 1;
}
