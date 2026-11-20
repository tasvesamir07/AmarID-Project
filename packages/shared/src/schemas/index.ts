/**
 * Shared Zod validation schemas.
 * Input validation everywhere (OWASP ASVS L2). All API DTOs validated against these.
 */
import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid UUID');
export const objectIdLikeSchema = z.string().min(1).max(128);

export const universalIdSchema = z
  .string()
  .regex(/^AID-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/, 'Invalid Universal ID format');

// NID / Passport input (never stored raw — validated only in memory)
export const docInputSchema = z.object({
  docType: z.enum(['NID', 'PASSPORT']),
  number: z.string().min(5).max(40),
  image: z.instanceof(Buffer).optional(),
});

// OTP
export const otpRequestSchema = z.object({
  purpose: z.enum(['SIGNUP_SIM', 'SIGNUP_EMAIL', 'STEP_UP', 'RECOVERY', 'CHANGE_CONTACT']),
  channel: z.enum(['sms', 'email']),
  destination: z.string().min(1).max(200),
  enrollmentId: z.string().uuid().optional(),
});

export const otpVerifySchema = z.object({
  challengeId: z.string().min(8).max(128),
  code: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const otpResendSchema = z.object({
  challengeId: z.string().min(8).max(128),
});

// Enrollment
export const enrollmentStartSchema = z.object({
  docType: z.enum(['NID', 'PASSPORT']),
  docNumber: z.string().min(5).max(40),
  msisdn: z.string().min(5).max(25),
  email: z.string().email().optional(),
  clientFingerprintHash: z.string().min(1).max(128),
});

export const enrollmentDocumentSchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  docType: z.enum(['NID', 'PASSPORT']),
  docNumber: z.string().min(5).max(40),
});

export const enrollmentSimOtpRequestSchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  msisdn: z.string().min(5).max(25),
});

export const enrollmentSimOtpVerifySchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  msisdn: z.string().min(5).max(25).optional(),
  challengeId: z.string().min(8).max(128),
  code: z.string().regex(/^\d{6}$/),
});

export const enrollmentEmailOtpRequestSchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  email: z.string().email(),
});

export const enrollmentEmailOtpVerifySchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  challengeId: z.string().min(8).max(128),
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
});

export const enrollmentLivenessSchema = z.object({
  enrollmentId: z.string().uuid().optional(),
});

export const enrollmentLivenessResultSchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  sessionId: z.string(),
  faceProbe: z.string().optional(), // base64 capture (mock)
});

export const enrollmentFingerprintSchema = z.object({
  enrollmentId: z.string().uuid().optional(),
  template: z.string(), // base64 raw capture (protected server-side)
});

export const enrollmentFinalizeSchema = z.object({
  enrollmentId: z.string().uuid().optional(),
});

// Auth / WebAuthn
export const authChallengeSchema = z.object({
  universalId: z.string().optional(),
});

export const authVerifySchema = z.object({
  credentialId: z.string(),
  authenticatorData: z.string(),
  clientDataJson: z.string(),
  signature: z.string(),
  userHandle: z.string().optional(),
});

// OIDC authorize
export const oidcAuthorizeSchema = z.object({
  response_type: z.literal('code'),
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  scope: z.string().optional(),
  state: z.string().min(1),
  nonce: z.string().optional().default(''),
  code_challenge: z.string().min(1),
  code_challenge_method: z.literal('S256'),
  acr_values: z.string().optional(),
  max_age: z.coerce.number().optional(),
});

// Consent
export const consentGrantSchema = z.object({
  identityId: z.string().uuid(),
  clientId: z.string().min(1),
  scopes: z.array(z.string()).min(1),
});

// e-KYC
export const ekycRequestSchema = z.object({
  level: z.enum(['basic', 'standard', 'enhanced']),
  attributes: z.array(z.string()).optional(),
  purpose: z.string().min(1).max(200),
  retentionPeriodDays: z.coerce.number().min(1).max(3650).optional(),
});

// Proof-of-life
export const proofOfLifeStartSchema = z.object({
  identityId: z.string().uuid(),
});

export const proofOfLifeCompleteSchema = z.object({
  identityId: z.string().uuid(),
  method: z.string().min(1),
  livenessSessionId: z.string().optional(),
});

// Error envelope
export const problemJsonSchema = z.object({
  type: z.string().url(),
  title: z.string(),
  code: z.string(),
  traceId: z.string(),
  detail: z.string().optional(),
  instance: z.string().optional(),
});

export type ProblemJson = z.infer<typeof problemJsonSchema>;
