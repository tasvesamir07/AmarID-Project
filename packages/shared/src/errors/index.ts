/**
 * AmarID application errors.
 * Generic, uniform messages to avoid enumeration (file 03 rule).
 */

export class AmaridError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly traceId: string;
  public readonly isPublic: boolean; // safe to show to end user

  constructor(code: string, message: string, statusCode = 500, isPublic = false) {
    super(message);
    this.name = 'AmaridError';
    this.code = code;
    this.statusCode = statusCode;
    this.traceId = crypto.randomUUID();
    this.isPublic = isPublic;
  }
}

/** Public, enumeration-safe errors */
export class ValidationError extends AmaridError {
  constructor(message = 'Invalid request') {
    super('VALIDATION_ERROR', message, 400, true);
  }
}

export class NotFoundError extends AmaridError {
  constructor(resource = 'Resource') {
    super('NOT_FOUND', `${resource} not found`, 404, true);
  }
}

export class UnauthorizedError extends AmaridError {
  constructor(message = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401, true);
  }
}

export class ForbiddenError extends AmaridError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403, true);
  }
}

export class ConflictError extends AmaridError {
  constructor(message = 'Conflict') {
    super('CONFLICT', message, 409, true);
  }
}

export class TooManyRequestsError extends AmaridError {
  constructor(message = 'Too many requests', public readonly retryAfter?: number) {
    super('TOO_MANY_REQUESTS', message, 429, true);
  }
}

/** Internal errors — never leak details to client */
export class InternalError extends AmaridError {
  constructor(message = 'Internal server error', public readonly cause?: unknown) {
    super('INTERNAL_ERROR', message, 500, false);
  }
}

export class UnavailableError extends AmaridError {
  constructor(service: string) {
    super('SERVICE_UNAVAILABLE', `${service} temporarily unavailable`, 503, true);
  }
}

export interface ErrorEnvelope {
  type: string;
  title: string;
  code: string;
  traceId: string;
  detail?: string;
}

export function toErrorEnvelope(err: Error, baseUrl: string): ErrorEnvelope {
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
