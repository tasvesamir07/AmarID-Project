"use strict";
/**
 * AmarID application errors.
 * Generic, uniform messages to avoid enumeration (file 03 rule).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnavailableError = exports.InternalError = exports.TooManyRequestsError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AmaridError = void 0;
exports.toErrorEnvelope = toErrorEnvelope;
class AmaridError extends Error {
    code;
    statusCode;
    traceId;
    isPublic; // safe to show to end user
    constructor(code, message, statusCode = 500, isPublic = false) {
        super(message);
        this.name = 'AmaridError';
        this.code = code;
        this.statusCode = statusCode;
        this.traceId = crypto.randomUUID();
        this.isPublic = isPublic;
    }
}
exports.AmaridError = AmaridError;
/** Public, enumeration-safe errors */
class ValidationError extends AmaridError {
    constructor(message = 'Invalid request') {
        super('VALIDATION_ERROR', message, 400, true);
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends AmaridError {
    constructor(resource = 'Resource') {
        super('NOT_FOUND', `${resource} not found`, 404, true);
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AmaridError {
    constructor(message = 'Unauthorized') {
        super('UNAUTHORIZED', message, 401, true);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AmaridError {
    constructor(message = 'Forbidden') {
        super('FORBIDDEN', message, 403, true);
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AmaridError {
    constructor(message = 'Conflict') {
        super('CONFLICT', message, 409, true);
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AmaridError {
    retryAfter;
    constructor(message = 'Too many requests', retryAfter) {
        super('TOO_MANY_REQUESTS', message, 429, true);
        this.retryAfter = retryAfter;
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
/** Internal errors — never leak details to client */
class InternalError extends AmaridError {
    cause;
    constructor(message = 'Internal server error', cause) {
        super('INTERNAL_ERROR', message, 500, false);
        this.cause = cause;
    }
}
exports.InternalError = InternalError;
class UnavailableError extends AmaridError {
    constructor(service) {
        super('SERVICE_UNAVAILABLE', `${service} temporarily unavailable`, 503, true);
    }
}
exports.UnavailableError = UnavailableError;
function toErrorEnvelope(err, baseUrl) {
    if (err instanceof AmaridError) {
        return {
            type: `${baseUrl}/problems/${err.code}`,
            title: err.statusCode >= 500 ? 'Server Error' : err.message,
            code: err.code,
            traceId: err.traceId,
            detail: err.isPublic ? err.message : undefined,
        };
    }
    return {
        type: `${baseUrl}/problems/internal_error`,
        title: 'Server Error',
        code: 'INTERNAL_ERROR',
        traceId: crypto.randomUUID(),
    };
}
