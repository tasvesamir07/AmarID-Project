/**
 * Shared Zod validation schemas.
 * Input validation everywhere (OWASP ASVS L2). All API DTOs validated against these.
 */
import { z } from 'zod';
export declare const uuidSchema: z.ZodString;
export declare const objectIdLikeSchema: z.ZodString;
export declare const universalIdSchema: z.ZodString;
export declare const docInputSchema: z.ZodObject<{
    docType: z.ZodEnum<["NID", "PASSPORT"]>;
    number: z.ZodString;
    image: z.ZodOptional<z.ZodType<Buffer, z.ZodTypeDef, Buffer>>;
}, "strip", z.ZodTypeAny, {
    number: string;
    docType: "NID" | "PASSPORT";
    image?: Buffer | undefined;
}, {
    number: string;
    docType: "NID" | "PASSPORT";
    image?: Buffer | undefined;
}>;
export declare const otpRequestSchema: z.ZodObject<{
    purpose: z.ZodEnum<["SIGNUP_SIM", "SIGNUP_EMAIL", "STEP_UP", "RECOVERY", "CHANGE_CONTACT"]>;
    channel: z.ZodEnum<["sms", "email"]>;
    destination: z.ZodString;
    enrollmentId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    purpose: "SIGNUP_SIM" | "SIGNUP_EMAIL" | "STEP_UP" | "RECOVERY" | "CHANGE_CONTACT";
    channel: "sms" | "email";
    destination: string;
    enrollmentId?: string | undefined;
}, {
    purpose: "SIGNUP_SIM" | "SIGNUP_EMAIL" | "STEP_UP" | "RECOVERY" | "CHANGE_CONTACT";
    channel: "sms" | "email";
    destination: string;
    enrollmentId?: string | undefined;
}>;
export declare const otpVerifySchema: z.ZodObject<{
    challengeId: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    challengeId: string;
    code: string;
}, {
    challengeId: string;
    code: string;
}>;
export declare const otpResendSchema: z.ZodObject<{
    challengeId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    challengeId: string;
}, {
    challengeId: string;
}>;
export declare const enrollmentStartSchema: z.ZodObject<{
    docType: z.ZodEnum<["NID", "PASSPORT"]>;
    docNumber: z.ZodString;
    msisdn: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    clientFingerprintHash: z.ZodString;
}, "strip", z.ZodTypeAny, {
    msisdn: string;
    docNumber: string;
    docType: "NID" | "PASSPORT";
    clientFingerprintHash: string;
    email?: string | undefined;
}, {
    msisdn: string;
    docNumber: string;
    docType: "NID" | "PASSPORT";
    clientFingerprintHash: string;
    email?: string | undefined;
}>;
export declare const enrollmentDocumentSchema: z.ZodObject<{
    enrollmentId: z.ZodString;
    docType: z.ZodEnum<["NID", "PASSPORT"]>;
    docNumber: z.ZodString;
}, "strip", z.ZodTypeAny, {
    docNumber: string;
    docType: "NID" | "PASSPORT";
    enrollmentId: string;
}, {
    docNumber: string;
    docType: "NID" | "PASSPORT";
    enrollmentId: string;
}>;
export declare const enrollmentSimOtpRequestSchema: z.ZodObject<{
    enrollmentId: z.ZodString;
    msisdn: z.ZodString;
}, "strip", z.ZodTypeAny, {
    msisdn: string;
    enrollmentId: string;
}, {
    msisdn: string;
    enrollmentId: string;
}>;
export declare const enrollmentSimOtpVerifySchema: z.ZodObject<{
    enrollmentId: z.ZodString;
    challengeId: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    challengeId: string;
    code: string;
    enrollmentId: string;
}, {
    challengeId: string;
    code: string;
    enrollmentId: string;
}>;
export declare const enrollmentLivenessSchema: z.ZodObject<{
    enrollmentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    enrollmentId: string;
}, {
    enrollmentId: string;
}>;
export declare const enrollmentLivenessResultSchema: z.ZodObject<{
    enrollmentId: z.ZodString;
    sessionId: z.ZodString;
    passed: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    passed: boolean;
    enrollmentId: string;
    sessionId: string;
}, {
    passed: boolean;
    enrollmentId: string;
    sessionId: string;
}>;
export declare const enrollmentFingerprintSchema: z.ZodObject<{
    enrollmentId: z.ZodString;
    template: z.ZodString;
}, "strip", z.ZodTypeAny, {
    template: string;
    enrollmentId: string;
}, {
    template: string;
    enrollmentId: string;
}>;
export declare const enrollmentFinalizeSchema: z.ZodObject<{
    enrollmentId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    enrollmentId: string;
}, {
    enrollmentId: string;
}>;
export declare const authChallengeSchema: z.ZodObject<{
    universalId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    universalId?: string | undefined;
}, {
    universalId?: string | undefined;
}>;
export declare const authVerifySchema: z.ZodObject<{
    credentialId: z.ZodString;
    authenticatorData: z.ZodString;
    clientDataJson: z.ZodString;
    signature: z.ZodString;
    userHandle: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    credentialId: string;
    authenticatorData: string;
    clientDataJson: string;
    signature: string;
    userHandle?: string | undefined;
}, {
    credentialId: string;
    authenticatorData: string;
    clientDataJson: string;
    signature: string;
    userHandle?: string | undefined;
}>;
export declare const oidcAuthorizeSchema: z.ZodObject<{
    response_type: z.ZodLiteral<"code">;
    client_id: z.ZodString;
    redirect_uri: z.ZodString;
    scope: z.ZodOptional<z.ZodString>;
    state: z.ZodString;
    nonce: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    code_challenge: z.ZodString;
    code_challenge_method: z.ZodLiteral<"S256">;
    acr_values: z.ZodOptional<z.ZodString>;
    max_age: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    client_id: string;
    nonce: string;
    state: string;
    response_type: "code";
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: "S256";
    scope?: string | undefined;
    acr_values?: string | undefined;
    max_age?: number | undefined;
}, {
    client_id: string;
    state: string;
    response_type: "code";
    redirect_uri: string;
    code_challenge: string;
    code_challenge_method: "S256";
    nonce?: string | undefined;
    scope?: string | undefined;
    acr_values?: string | undefined;
    max_age?: number | undefined;
}>;
export declare const consentGrantSchema: z.ZodObject<{
    identityId: z.ZodString;
    clientId: z.ZodString;
    scopes: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    clientId: string;
    scopes: string[];
    identityId: string;
}, {
    clientId: string;
    scopes: string[];
    identityId: string;
}>;
export declare const ekycRequestSchema: z.ZodObject<{
    level: z.ZodEnum<["basic", "standard", "enhanced"]>;
    attributes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    purpose: z.ZodString;
    retentionPeriodDays: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    purpose: string;
    level: "basic" | "standard" | "enhanced";
    attributes?: string[] | undefined;
    retentionPeriodDays?: number | undefined;
}, {
    purpose: string;
    level: "basic" | "standard" | "enhanced";
    attributes?: string[] | undefined;
    retentionPeriodDays?: number | undefined;
}>;
export declare const proofOfLifeStartSchema: z.ZodObject<{
    identityId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    identityId: string;
}, {
    identityId: string;
}>;
export declare const proofOfLifeCompleteSchema: z.ZodObject<{
    identityId: z.ZodString;
    method: z.ZodString;
    livenessSessionId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    method: string;
    identityId: string;
    livenessSessionId?: string | undefined;
}, {
    method: string;
    identityId: string;
    livenessSessionId?: string | undefined;
}>;
export declare const problemJsonSchema: z.ZodObject<{
    type: z.ZodString;
    title: z.ZodString;
    code: z.ZodString;
    traceId: z.ZodString;
    detail: z.ZodOptional<z.ZodString>;
    instance: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: string;
    code: string;
    traceId: string;
    title: string;
    detail?: string | undefined;
    instance?: string | undefined;
}, {
    type: string;
    code: string;
    traceId: string;
    title: string;
    detail?: string | undefined;
    instance?: string | undefined;
}>;
export type ProblemJson = z.infer<typeof problemJsonSchema>;
