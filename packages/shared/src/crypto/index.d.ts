/**
 * AmarID cryptographic helpers.
 * No custom crypto — relies on Node crypto + libsodium-style primitives.
 * All keys/pepper come from environment (KMS abstraction in production).
 */
/** Hex encode */
export declare function hex(data: Buffer | Uint8Array): string;
/** Secure random bytes -> hex */
export declare function randomHex(bytes?: number): string;
/** HMAC-SHA256 */
export declare function hmacSha256(key: Buffer | string, data: Buffer | string): Buffer;
/** HMAC-SHA256 hex */
export declare function hmacSha256Hex(key: Buffer | string, data: Buffer | string): string;
/** SHA-256 hex */
export declare function sha256Hex(data: Buffer | string): string;
/** Constant-time compare to prevent timing leaks */
export declare function constantTimeEqual(a: Buffer | string, b: Buffer | string): boolean;
/**
 * Derive a document uniqueness key (never stores raw NID/passport).
 * docHmac = HMAC-SHA256(pepper, normalized_number)
 */
export declare function docHmac(normalizedNumber: string, pepper: string): string;
/** MSISDN HMAC for SIM binding lookup */
export declare function msisdnHmac(msisdn: string, pepper: string): string;
/** Enrollment / challenge identifier */
export declare function enrollmentToken(): string;
/** Mask a Universal ID for display: AID-7K4M-••••-92QX */
export declare function maskUniversalId(universalId: string): string;
