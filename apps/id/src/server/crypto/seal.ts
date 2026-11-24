import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { deriveKey } from "./keys";

const VERSION = 1;

/**
 * Authenticated encryption for values that must be readable again
 * (name, date of birth, phone, face template, signing keys).
 *
 * `context` is bound as associated data, so a ciphertext copied into another
 * row or column fails to open. Layout: version(1) | nonce(12) | tag(16) | data.
 */
/** Bytes as the database driver expects them. */
export type Bytes = Uint8Array<ArrayBuffer>;

export function seal(plaintext: string | Uint8Array, context: string): Bytes {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey("seal"), nonce);
  cipher.setAAD(Buffer.from(context, "utf8"));
  const data = Buffer.concat([
    cipher.update(typeof plaintext === "string" ? Buffer.from(plaintext, "utf8") : plaintext),
    cipher.final(),
  ]);
  return new Uint8Array(Buffer.concat([Buffer.from([VERSION]), nonce, cipher.getAuthTag(), data]));
}

export function open(blob: Uint8Array, context: string): Buffer {
  const buf = Buffer.from(blob);
  if (buf.length < 29 || buf[0] !== VERSION) throw new Error("sealed value is malformed");
  const decipher = createDecipheriv("aes-256-gcm", deriveKey("seal"), buf.subarray(1, 13));
  decipher.setAAD(Buffer.from(context, "utf8"));
  decipher.setAuthTag(buf.subarray(13, 29));
  return Buffer.concat([decipher.update(buf.subarray(29)), decipher.final()]);
}

export const openText = (blob: Uint8Array, context: string) => open(blob, context).toString("utf8");
