/**
 * AmarID shared constants.
 * Security-relevant defaults from the prompt pack (03-AUTH-OTP-EMAIL.md, 04-SECURITY-PRIVACY.md).
 */
export declare const BRAND: {
    readonly name: "AmarID";
    readonly tagline: "আপনার পরিচয়, আপনার নিয়ন্ত্রণ";
    readonly primary: "#006A4E";
    readonly accent: "#F42A41";
};
export declare const LOCALES: readonly ["bn", "en"];
export type Locale = (typeof LOCALES)[number];
export declare const OTP: {
    readonly length: 6;
    readonly smsTtlSeconds: 300;
    readonly emailTtlSeconds: 600;
    readonly maxVerifyAttempts: 5;
    readonly resendCooldownSeconds: 60;
    readonly maxResends: 3;
    readonly destinationPerHour: 5;
    readonly destinationPerDay: 10;
    readonly ipPerHour: 20;
    readonly devicePerHour: 10;
    readonly lockoutFailedThreshold: 10;
    readonly lockoutMinutes: 30;
};
export declare const SESSION: {
    readonly accessTokenTtlSeconds: 600;
    readonly refreshMaxAgeDays: 30;
    readonly refreshHardMaxDays: 90;
    readonly pairingSessionTtlSeconds: 90;
};
export declare const PROOF_OF_LIFE: {
    readonly defaultCycleDays: 365;
    readonly reminderDays: readonly [60, 30, 7];
    readonly graceDays: 30;
};
export declare const ASSURANCE_LEVELS: {
    readonly LOA1: "aid:loa1";
    readonly LOA2: "aid:loa2";
    readonly LOA3: "aid:loa3";
};
export declare const EKYC_LEVELS: readonly ["basic", "standard", "enhanced"];
export declare const BIOMETRIC: {
    readonly faceDedupThreshold: 0.85;
    readonly fingerDedupThreshold: 0.9;
    readonly ambiguousBand: 0.05;
};
export declare const CRYPTO: {
    readonly keyVersion: 1;
    readonly aeadNonceSize: 12;
    readonly hmacKeyLength: 32;
};
export declare const RATE_LIMIT: {
    readonly windowSeconds: 3600;
    readonly maxRequests: 20;
};
export declare const DEMO: {
    readonly scenarioHeader: "x-demo-scenario";
    readonly guidedModeFlag: "FEATURE_GUIDED_DEMO";
};
