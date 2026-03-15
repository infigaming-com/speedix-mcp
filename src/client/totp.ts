import { createHmac } from "node:crypto";

// Base32 decoding (RFC 4648)
const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(input: string): Buffer {
  const cleaned = input.replace(/[\s=-]/g, "").toUpperCase();
  let bits = "";
  for (const char of cleaned) {
    const val = BASE32_CHARS.indexOf(char);
    if (val === -1) throw new Error(`Invalid base32 character: ${char}`);
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Generate a TOTP code from a base32-encoded secret.
 * Uses SHA-1, 30-second time step, 6-digit output (RFC 6238).
 */
export function generateTotpCode(base32Secret: string): string {
  const key = base32Decode(base32Secret);
  const timeStep = Math.floor(Date.now() / 1000 / 30);

  // Encode time step as 8-byte big-endian
  const timeBuffer = Buffer.alloc(8);
  timeBuffer.writeUInt32BE(Math.floor(timeStep / 0x100000000), 0);
  timeBuffer.writeUInt32BE(timeStep & 0xffffffff, 4);

  const hmac = createHmac("sha1", key).update(timeBuffer).digest();

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (code % 1_000_000).toString().padStart(6, "0");
}
