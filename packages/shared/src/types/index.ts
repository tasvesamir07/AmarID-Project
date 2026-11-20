/**
 * AmarID shared domain types.
 * These describe the canonical data model used across API, web, and demo-RP.
 */

export type IdentityStatus =
  | 'pending'
  | 'active'
  | 'dormant'
  | 'suspended'
  | 'revoked'
  | 'deceased';

export type EnrollmentState =
  | 'STARTED'
  | 'DOC_VERIFIED'
  | 'SIM_VERIFIED'
  | 'EMAIL_VERIFIED'
  | 'LIVENESS_PASSED'
  | 'FINGERPRINT_CAPTURED'
  | 'DEDUP_CHECKED'
  | 'ISSUED'
  | 'REJECTED_DUPLICATE'
  | 'REJECTED_DOC'
  | 'REJECTED_LIVENESS'
  | 'EXPIRED';

export type BiometricModality = 'face' | 'finger';

export type AssuranceLevel = 'aid:loa1' | 'aid:loa2' | 'aid:loa3';

export type OtpPurpose =
  | 'SIGNUP_SIM'
  | 'SIGNUP_EMAIL'
  | 'STEP_UP'
  | 'RECOVERY'
  | 'CHANGE_CONTACT';

export type OtpChannel = 'sms' | 'email';

export type OidcClientType = 'confidential' | 'public';

export type PartnerTier = 'sandbox' | 'verified' | 'regulated';

export interface Identity {
  id: string;
  universalId: string;
  docHmac: string; // HMAC-SHA256(pepper, normalized NID/passport)
  status: IdentityStatus;
  assuranceLevel: AssuranceLevel;
  issuedAt: Date | null;
  lastProofOfLifeAt: Date | null;
  nextProofOfLifeDueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BioTemplate {
  id: string;
  identityId: string;
  modality: BiometricModality;
  protectedBlob: Buffer; // AES-256-GCM encrypted protected template
  keyVersion: number;
  createdAt: Date;
}

export interface SimBinding {
  id: string;
  identityId: string;
  msisdnHmac: string;
  msisdnEnc: string; // encrypted (for notifications)
  verifiedAt: Date | null;
  active: boolean;
}

export interface Contact {
  id: string;
  identityId: string;
  emailHmac: string;
  emailEnc: string;
  verifiedAt: Date | null;
}

export interface Device {
  id: string;
  identityId: string;
  webauthnCredentialId: string;
  publicKeyPem: string;
  signCount: number;
  label: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
}

export interface Enrollment {
  id: string;
  identityId: string | null;
  state: EnrollmentState;
  clientFingerprintHash: string;
  expiresAt: Date;
  docVerifiedAt: Date | null;
  simVerifiedAt: Date | null;
  livenessPassedAt: Date | null;
  fingerprintCapturedAt: Date | null;
  dedupCheckedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface OidcClient {
  id: string;
  clientId: string;
  name: string;
  secretHash: string | null; // null for public clients
  redirectUris: string[];
  scopes: string[];
  type: OidcClientType;
  sectorIdentifier: string | null;
  verifiedPartner: boolean;
  tier: PartnerTier;
  createdAt: Date;
}

export interface Consent {
  id: string;
  identityId: string;
  clientId: string;
  scopes: string[];
  grantedAt: Date;
  revokedAt: Date | null;
  expiresAt: Date | null;
}

export interface PairwiseSubject {
  id: string;
  identityId: string;
  clientSector: string;
  subject: string; // pairwise pseudonymous sub
}

export interface EkycRequest {
  id: string;
  clientId: string;
  identityId: string;
  level: 'basic' | 'standard' | 'enhanced';
  status: 'pending' | 'approved' | 'denied' | 'expired';
  attestationJws: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface ProofOfLifeEvent {
  id: string;
  identityId: string;
  dueAt: Date;
  completedAt: Date | null;
  method: string | null;
  result: 'pass' | 'fail' | 'skipped' | null;
  scoreBucket: string | null;
}

export interface AuditLogEntry {
  id: string;
  actor: string | null;
  action: string;
  subjectPseudonym: string | null;
  metadata: Record<string, unknown>;
  prevHash: string;
  hash: string;
  createdAt: Date;
}

/** Public-facing masked Universal ID */
export interface UniversalIdCard {
  maskedId: string; // e.g. AID-7K4M-••••-92QX
  name: string | null;
  verificationBadges: VerificationBadge[];
  status: IdentityStatus;
  nextProofOfLifeInDays: number | null;
}

export interface VerificationBadge {
  modality: BiometricModality | 'nid' | 'sim';
  verified: boolean;
}

/** Adapter result types */
export interface NidResult {
  verified: boolean;
  name: string | null;
  dob: string | null;
  docType: 'NID' | 'PASSPORT';
  matchScore: number | null;
  reason: string | null;
}

export interface SimResult {
  ownerMatches: boolean;
  operator: string | null;
  reason: string | null;
}

export interface LivenessResult {
  passed: boolean;
  score: number;
  presentationAttackDetected: boolean;
  reason: string | null;
}

export interface FingerprintResult {
  matched: boolean;
  score: number;
  templateId: string | null;
  reason: string | null;
}

/** Adapter interfaces — each external dependency sits behind one of these */
export interface NidProvider {
  verify(input: { docType: string; number: string; image?: Buffer }): Promise<NidResult>;
}

export interface SimRegistry {
  ownerMatches(msisdn: string, docRef: string): Promise<SimResult>;
}

export interface LivenessProvider {
  verify(sessionId: string, frame?: Buffer): Promise<LivenessResult>;
}

export interface FingerprintMatcher {
  extract(raw: Buffer): Promise<{ template: Buffer }>;
  match(probe: Buffer, enrolled: Buffer): Promise<FingerprintResult>;
}

export interface SmsGateway {
  send(to: string, text: string): Promise<{ messageId: string }>;
}

export interface Mailer {
  send(message: { to: string; subject: string; html: string; text: string }): Promise<void>;
}

export interface DeceasedRegistry {
  check(docRef: string): Promise<{ deceased: boolean; source: string | null }>;
}

/** Generic result */
export interface ServiceResult<T> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    traceId: string;
  };
}
