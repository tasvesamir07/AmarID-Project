/**
 * AmarID application errors.
 * Generic, uniform messages to avoid enumeration (file 03 rule).
 */
export declare class AmaridError extends Error {
    readonly code: string;
    readonly statusCode: number;
    readonly traceId: string;
    readonly isPublic: boolean;
    constructor(code: string, message: string, statusCode?: number, isPublic?: boolean);
}
/** Public, enumeration-safe errors */
export declare class ValidationError extends AmaridError {
    constructor(message?: string);
}
export declare class NotFoundError extends AmaridError {
    constructor(resource?: string);
}
export declare class UnauthorizedError extends AmaridError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AmaridError {
    constructor(message?: string);
}
export declare class ConflictError extends AmaridError {
    constructor(message?: string);
}
export declare class TooManyRequestsError extends AmaridError {
    readonly retryAfter?: number | undefined;
    constructor(message?: string, retryAfter?: number | undefined);
}
/** Internal errors — never leak details to client */
export declare class InternalError extends AmaridError {
    readonly cause?: unknown;
    constructor(message?: string, cause?: unknown);
}
export declare class UnavailableError extends AmaridError {
    constructor(service: string);
}
export interface ErrorEnvelope {
    type: string;
    title: string;
    code: string;
    traceId: string;
    detail?: string;
}
export declare function toErrorEnvelope(err: Error, baseUrl: string): ErrorEnvelope;
