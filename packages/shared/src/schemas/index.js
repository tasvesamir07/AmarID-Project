"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.problemJsonSchema = exports.proofOfLifeCompleteSchema = exports.proofOfLifeStartSchema = exports.ekycRequestSchema = exports.consentGrantSchema = exports.oidcAuthorizeSchema = exports.authVerifySchema = exports.authChallengeSchema = exports.enrollmentFinalizeSchema = exports.enrollmentFingerprintSchema = exports.enrollmentLivenessResultSchema = exports.enrollmentLivenessSchema = exports.enrollmentSimOtpVerifySchema = exports.enrollmentSimOtpRequestSchema = exports.enrollmentDocumentSchema = exports.enrollmentStartSchema = exports.otpResendSchema = exports.otpVerifySchema = exports.otpRequestSchema = exports.docInputSchema = exports.universalIdSchema = exports.objectIdLikeSchema = exports.uuidSchema = void 0;
/**
 * Shared Zod validation schemas.
 * Input validation everywhere (OWASP ASVS L2). All API DTOs validated against these.
 */
const zod_1 = require("zod");
exports.uuidSchema = zod_1.z.string().uuid('Invalid UUID');
exports.objectIdLikeSchema = zod_1.z.string().min(1).max(128);
exports.universalIdSchema = zod_1.z
    .string()
    .regex(/^AID-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid Universal ID format');
// NID / Passport input (never stored raw — validated only in memory)
exports.docInputSchema = zod_1.z.object({
    docType: zod_1.z.enum(['NID', 'PASSPORT']),
    number: zod_1.z.string().min(5).max(40),
    image: zod_1.z.instanceof(Buffer).optional(),
});
// OTP
exports.otpRequestSchema = zod_1.z.object({
    purpose: zod_1.z.enum(['SIGNUP_SIM', 'SIGNUP_EMAIL', 'STEP_UP', 'RECOVERY', 'CHANGE_CONTACT']),
    channel: zod_1.z.enum(['sms', 'email']),
    destination: zod_1.z.string().min(1).max(200),
    enrollmentId: zod_1.z.string().uuid().optional(),
});
exports.otpVerifySchema = zod_1.z.object({
    challengeId: zod_1.z.string().uuid(),
    code: zod_1.z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});
exports.otpResendSchema = zod_1.z.object({
    challengeId: zod_1.z.string().uuid(),
});
// Enrollment
exports.enrollmentStartSchema = zod_1.z.object({
    docType: zod_1.z.enum(['NID', 'PASSPORT']),
    docNumber: zod_1.z.string().min(5).max(40),
    msisdn: zod_1.z.string().min(5).max(25),
    email: zod_1.z.string().email().optional(),
    clientFingerprintHash: zod_1.z.string().min(1).max(128),
});
exports.enrollmentDocumentSchema = zod_1.z.object({
    enrollmentId: zod_1.z.string().uuid(),
    docType: zod_1.z.enum(['NID', 'PASSPORT']),
    docNumber: zod_1.z.string().min(5).max(40),
});
exports.enrollmentSimOtpRequestSchema = zod_1.z.object({
    enrollmentId: zod_1.z.string().uuid(),
    msisdn: zod_1.z.string().min(5).max(25),
});
exports.enrollmentSimOtpVerifySchema = zod_1.z.object({
    enrollmentId: zod_1.z.string().uuid(),
    challengeId: zod_1.z.string().uuid(),
    code: zod_1.z.string().regex(/^\d{6}$/),
});
exports.enrollmentLivenessSchema = zod_1.z.object({
    enrollmentId: zod_1.z.string().uuid(),
});
exports.enrollmentLivenessResultSchema = zod_1.z.object({
    enrollmentId: zod_1.z.string().uuid(),
    sessionId: zod_1.z.string(),
    passed: zod_1.z.boolean(),
});
exports.enrollmentFingerprintSchema = zod_1.z.object({
    enrollmentId: zod_1.z.string().uuid(),
    template: zod_1.z.string(), // base64 protected template (mock)
});
exports.enrollmentFinalizeSchema = zod_1.z.object({
    enrollmentId: zod_1.z.string().uuid(),
});
// Auth / WebAuthn
exports.authChallengeSchema = zod_1.z.object({
    universalId: zod_1.z.string().optional(),
});
exports.authVerifySchema = zod_1.z.object({
    credentialId: zod_1.z.string(),
    authenticatorData: zod_1.z.string(),
    clientDataJson: zod_1.z.string(),
    signature: zod_1.z.string(),
    userHandle: zod_1.z.string().optional(),
});
// OIDC authorize
exports.oidcAuthorizeSchema = zod_1.z.object({
    response_type: zod_1.z.literal('code'),
    client_id: zod_1.z.string().min(1),
    redirect_uri: zod_1.z.string().url(),
    scope: zod_1.z.string().optional(),
    state: zod_1.z.string().min(1),
    nonce: zod_1.z.string().optional().default(''),
    code_challenge: zod_1.z.string().min(1),
    code_challenge_method: zod_1.z.literal('S256'),
    acr_values: zod_1.z.string().optional(),
    max_age: zod_1.z.coerce.number().optional(),
});
// Consent
exports.consentGrantSchema = zod_1.z.object({
    identityId: zod_1.z.string().uuid(),
    clientId: zod_1.z.string().min(1),
    scopes: zod_1.z.array(zod_1.z.string()).min(1),
});
// e-KYC
exports.ekycRequestSchema = zod_1.z.object({
    level: zod_1.z.enum(['basic', 'standard', 'enhanced']),
    attributes: zod_1.z.array(zod_1.z.string()).optional(),
    purpose: zod_1.z.string().min(1).max(200),
    retentionPeriodDays: zod_1.z.coerce.number().min(1).max(3650).optional(),
});
// Proof-of-life
exports.proofOfLifeStartSchema = zod_1.z.object({
    identityId: zod_1.z.string().uuid(),
});
exports.proofOfLifeCompleteSchema = zod_1.z.object({
    identityId: zod_1.z.string().uuid(),
    method: zod_1.z.string().min(1),
    livenessSessionId: zod_1.z.string().optional(),
});
// Error envelope
exports.problemJsonSchema = zod_1.z.object({
    type: zod_1.z.string().url(),
    title: zod_1.z.string(),
    code: zod_1.z.string(),
    traceId: zod_1.z.string(),
    detail: zod_1.z.string().optional(),
    instance: zod_1.z.string().optional(),
});
