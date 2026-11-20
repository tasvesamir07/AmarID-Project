"use strict";
/**
 * AmarID shared constants.
 * Security-relevant defaults from the prompt pack (03-AUTH-OTP-EMAIL.md, 04-SECURITY-PRIVACY.md).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEMO = exports.RATE_LIMIT = exports.CRYPTO = exports.BIOMETRIC = exports.EKYC_LEVELS = exports.ASSURANCE_LEVELS = exports.PROOF_OF_LIFE = exports.SESSION = exports.OTP = exports.LOCALES = exports.BRAND = void 0;
exports.BRAND = {
    name: 'AmarID',
    tagline: 'আপনার পরিচয়, আপনার নিয়ন্ত্রণ',
    primary: '#006A4E', // Bangladesh flag green
    accent: '#F42A41', // warm red-coral
};
exports.LOCALES = ['bn', 'en'];
// OTP rules (03-AUTH-OTP-EMAIL.md)
exports.OTP = {
    length: 6,
    smsTtlSeconds: 300, // 5 minutes
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
};
// Sessions (03-AUTH-OTP-EMAIL.md)
exports.SESSION = {
    accessTokenTtlSeconds: 600, // 10 minutes
    refreshMaxAgeDays: 30,
    refreshHardMaxDays: 90,
    pairingSessionTtlSeconds: 90, // hardware-tethered
};
// Proof-of-life (02-BACKEND-ARCHITECTURE.md)
exports.PROOF_OF_LIFE = {
    defaultCycleDays: 365, // 12 months
    reminderDays: [60, 30, 7],
    graceDays: 30,
};
// OIDC assurance levels (05-SSO-EKYC-INTEGRATION.md)
exports.ASSURANCE_LEVELS = {
    LOA1: 'aid:loa1', // SIM only
    LOA2: 'aid:loa2', // + document
    LOA3: 'aid:loa3', // + biometric liveness
};
// e-KYC levels
exports.EKYC_LEVELS = ['basic', 'standard', 'enhanced'];
// Biometric dedup thresholds (configurable; demo defaults)
exports.BIOMETRIC = {
    faceDedupThreshold: 0.85,
    fingerDedupThreshold: 0.90,
    ambiguousBand: 0.05, // scores within this band go to manual review
};
// Crypto
exports.CRYPTO = {
    keyVersion: 1,
    aeadNonceSize: 12,
    hmacKeyLength: 32,
};
// Rate limit keys
exports.RATE_LIMIT = {
    windowSeconds: 3600,
    maxRequests: 20,
};
// Demo
exports.DEMO = {
    scenarioHeader: 'x-demo-scenario',
    guidedModeFlag: 'FEATURE_GUIDED_DEMO',
};
