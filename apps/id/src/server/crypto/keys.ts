import { hkdfSync } from "node:crypto";
import { env } from "../env";

const cache = new Map<string, Buffer>();

/**
 * Every key in the system is derived from the single master key with
 * HKDF-SHA256 and a purpose label. Keys for different purposes are therefore
 * independent: learning one (say, the blind-index key) reveals nothing about
 * another (say, the sealing key). In production the master key lives in a
 * KMS/HSM and this function becomes a KMS call.
 */
export function deriveKey(purpose: string, length = 32): Buffer {
  const id = `${purpose}:${length}`;
  let key = cache.get(id);
  if (!key) {
    key = Buffer.from(hkdfSync("sha256", env().masterKey, "amarid/v1", purpose, length));
    cache.set(id, key);
  }
  return key;
}
