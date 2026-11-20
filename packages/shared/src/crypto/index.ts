/**
 * AmarID cryptographic helpers.
 * No custom crypto — relies on Node crypto + libsodium-style primitives.
 * All keys/pepper come from environment (KMS abstraction in production).
 */

import { createHmac, createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Hex encode */
export function hex(data: Buffer | Uint8Array): string {
  return Buffer.from(data).toString('hex');
}

/** Secure random bytes -> hex */
export function randomHex(bytes = 32): string {
  return hex(randomBytes(bytes));
}

/** HMAC-SHA256 */
export function hmacSha256(key: Buffer | string, data: Buffer | string): Buffer {
  return createHmac('sha256', Buffer.from(key)).update(Buffer.from(data)).digest();
}

/** HMAC-SHA256 hex */
export function hmacSha256Hex(key: Buffer | string, data: Buffer | string): string {
  return hex(hmacSha256(key, data));
}

/** SHA-256 hex */
export function sha256Hex(data: Buffer | string): string {
  return createHash('sha256').update(Buffer.from(data)).digest('hex');
}

/** Constant-time compare to prevent timing leaks */
export function constantTimeEqual(a: Buffer | string, b: Buffer | string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/**
 * Derive a document uniqueness key (never stores raw NID/passport).
 * docHmac = HMAC-SHA256(pepper, normalized_number)
 */
export function docHmac(normalizedNumber: string, pepper: string): string {
  return hmacSha256Hex(pepper, normalizedNumber.toUpperCase().replace(/\s/g, ''));
}

/** MSISDN HMAC for SIM binding lookup */
export function msisdnHmac(msisdn: string, pepper: string): string {
  return hmacSha256Hex(pepper, msisdn.replace(/\D/g, ''));
}

/** Enrollment / challenge identifier */
export function enrollmentToken(): string {
  return randomHex(16);
}

/** Mask a Universal ID for display: AID-7K4M-••••-92QX */
export function maskUniversalId(universalId: string): string {
  const m = /^AID-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/.exec(universalId);
  if (!m) return universalId;
  return `AID-${m[1]}-••••-${m[3]}`;
}
