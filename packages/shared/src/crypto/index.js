"use strict";
/**
 * AmarID cryptographic helpers.
 * No custom crypto — relies on Node crypto + libsodium-style primitives.
 * All keys/pepper come from environment (KMS abstraction in production).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.hex = hex;
exports.randomHex = randomHex;
exports.hmacSha256 = hmacSha256;
exports.hmacSha256Hex = hmacSha256Hex;
exports.sha256Hex = sha256Hex;
exports.constantTimeEqual = constantTimeEqual;
exports.docHmac = docHmac;
exports.msisdnHmac = msisdnHmac;
exports.enrollmentToken = enrollmentToken;
exports.maskUniversalId = maskUniversalId;
const node_crypto_1 = require("node:crypto");
/** Hex encode */
function hex(data) {
    return Buffer.from(data).toString('hex');
}
/** Secure random bytes -> hex */
function randomHex(bytes = 32) {
    return hex((0, node_crypto_1.randomBytes)(bytes));
}
/** HMAC-SHA256 */
function hmacSha256(key, data) {
    return (0, node_crypto_1.createHmac)('sha256', Buffer.from(key)).update(Buffer.from(data)).digest();
}
/** HMAC-SHA256 hex */
function hmacSha256Hex(key, data) {
    return hex(hmacSha256(key, data));
}
/** SHA-256 hex */
function sha256Hex(data) {
    return (0, node_crypto_1.createHash)('sha256').update(Buffer.from(data)).digest('hex');
}
/** Constant-time compare to prevent timing leaks */
function constantTimeEqual(a, b) {
    const ba = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ba.length !== bb.length)
        return false;
    return (0, node_crypto_1.timingSafeEqual)(ba, bb);
}
/**
 * Derive a document uniqueness key (never stores raw NID/passport).
 * docHmac = HMAC-SHA256(pepper, normalized_number)
 */
function docHmac(normalizedNumber, pepper) {
    return hmacSha256Hex(pepper, normalizedNumber.toUpperCase().replace(/\s/g, ''));
}
/** MSISDN HMAC for SIM binding lookup */
function msisdnHmac(msisdn, pepper) {
    return hmacSha256Hex(pepper, msisdn.replace(/\D/g, ''));
}
/** Enrollment / challenge identifier */
function enrollmentToken() {
    return randomHex(16);
}
/** Mask a Universal ID for display: AID-7K4M-••••-92QX */
function maskUniversalId(universalId) {
    const m = /^AID-([A-Z0-9]{4})-([A-Z0-9]{4})-([A-Z0-9]{4})$/.exec(universalId);
    if (!m)
        return universalId;
    return `AID-${m[1]}-••••-${m[3]}`;
}
