/**
 * AmarID shared constants.
 * Security-relevant defaults from the prompt pack (03-AUTH-OTP-EMAIL.md, 04-SECURITY-PRIVACY.md).
 */

export const BRAND = {
  name: 'AmarID',
  tagline: 'আপনার পরিচয়, আপনার নিয়ন্ত্রণ',
  primary: '#006A4E',   // Bangladesh flag green
  accent: '#F42A41',    // warm red-coral
} as const;

export const LOCALES = ['bn', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

// OTP rules (03-AUTH-OTP-EMAIL.md)
export const OTP = {
  length: 6,
  smsTtlSeconds: 300,   // 5 minutes
  emailTtlSeconds: 600, // 10 minutes
  maxVerifyAttempts: 5,
  resendCooldownSeconds: 60,
  maxResends: 3,
  destinationPerHour: 5,
  destinationPerDay: 10,
  ipPerHour: 20,
  devicePerHour: 10,
  lockoutFailedThreshold: 10, // across challenges in 1h
  lockoutMinutes: 30,
} as const;

// Sessions (03-AUTH-OTP-EMAIL.md)
export const SESSION = {
  accessTokenTtlSeconds: 600,   // 10 minutes
  refreshMaxAgeDays: 30,
  refreshHardMaxDays: 90,
  pairingSessionTtlSeconds: 90, // hardware-tethered
} as const;

// Proof-of-life (02-BACKEND-ARCHITECTURE.md)
export const PROOF_OF_LIFE = {
  defaultCycleDays: 365, // 12 months
  reminderDays: [60, 30, 7],
  graceDays: 30,
} as const;

// OIDC assurance levels (05-SSO-EKYC-INTEGRATION.md)
export const ASSURANCE_LEVELS = {
  LOA1: 'aid:loa1', // SIM only
  LOA2: 'aid:loa2', // + document
  LOA3: 'aid:loa3', // + biometric liveness
} as const;

// e-KYC levels
export const EKYC_LEVELS = ['basic', 'standard', 'enhanced'] as const;

// Biometric dedup thresholds (configurable; demo defaults)
export const BIOMETRIC = {
  faceDedupThreshold: 0.85,
  fingerDedupThreshold: 0.90,
  ambiguousBand: 0.05, // scores within this band go to manual review
} as const;

// Crypto
export const CRYPTO = {
  keyVersion: 1,
  aeadNonceSize: 12,
  hmacKeyLength: 32,
} as const;

// Rate limit keys
export const RATE_LIMIT = {
  windowSeconds: 3600,
  maxRequests: 20,
} as const;

// Demo
export const DEMO = {
  scenarioHeader: 'x-demo-scenario',
  guidedModeFlag: 'FEATURE_GUIDED_DEMO',
} as const;
