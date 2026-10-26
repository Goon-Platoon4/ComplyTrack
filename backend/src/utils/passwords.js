import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHmac,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
function base32Decode(value) {
  let bits = 0;
  let buffer = 0;
  const output = [];
  for (const char of value.toUpperCase().replace(/=+$/, "")) {
    const index = B32.indexOf(char);
    if (index < 0) throw new Error("Invalid base32 secret");
    buffer = (buffer << 5) | index;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}
function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
export async function hashPassword(value) {
  const salt = randomBytes(16);
  const derived = await scrypt(value, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
}
export async function verifyPassword(value, encoded) {
  try {
    const [algorithm, n, r, p, saltText, hashText] = encoded.split("$");
    if (algorithm !== "scrypt") return false;
    const expected = Buffer.from(hashText, "base64url");
    const actual = Buffer.from(
      await scrypt(value, Buffer.from(saltText, "base64url"), expected.length, {
        N: Number(n),
        r: Number(r),
        p: Number(p),
        maxmem: 64 * 1024 * 1024,
      }),
    );
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}
export function totpCode(secret, time = Date.now()) {
  const counter = Math.floor(time / 30000);
  const key = base32Decode(secret);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1000000).padStart(6, "0");
}
export function verifyTotp(code, secret) {
  if (!/^\d{6}$/.test(String(code || ""))) return false;
  for (const delta of [-30000, 0, 30000])
    if (totpCode(secret, Date.now() + delta) === String(code)) return true;
  return false;
}
export function generateTotpSecret() {
  return base32Encode(randomBytes(20));
}
