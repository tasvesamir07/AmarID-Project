import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { deriveKey } from "./keys";

/** URL-safe random secret (default 256 bits). */
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

/** SHA-256 for high-entropy secrets (session tokens, codes). Not for low-entropy values. */
export const sha256 = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("base64url");

/** Keyed hash for low-entropy values such as OTP codes. */
export const keyedHash = (purpose: string, value: string) =>
  createHmac("sha256", deriveKey(`mac/${purpose}`)).update(value).digest("base64url");

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * Blind index: lets the database enforce "this document / phone is used once"
 * without storing the value. Deterministic, keyed, one key per kind.
 */
export const blindIndex = (kind: "doc" | "phone", normalized: string) =>
  createHmac("sha256", deriveKey(`index/${kind}`)).update(normalized).digest("base64url");
