import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

/**
 * Request/response logging with PII redaction.
 * Never logs raw biometrics, NID numbers, OTPs, or full personal data.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const start = Date.now();
    const traceId = (req as any).traceId || 'unknown';
    (req as any).traceId = traceId;

    // Redact sensitive fields before logging
    const safeBody = this.redact(req.body);

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(
            `${req.method} ${req.url} - ${ms}ms - trace:${traceId} - body:${JSON.stringify(safeBody)}`,
          );
        },
        error: (err) => {
          const ms = Date.now() - start;
          this.logger.error(
            `${req.method} ${req.url} - ${ms}ms - trace:${traceId} - ERROR: ${err.message}`,
          );
        },
      }),
    );
  }

  private redact(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const sensitive = [
      'password', 'otp', 'code', 'nid', 'passport', 'msisdn', 'phone',
      'email', 'name', 'dob', 'image', 'template', 'protectedBlob',
    ];
    const out: any = Array.isArray(obj) ? [] : {};
    for (const [k, v] of Object.entries(obj)) {
      const lk = k.toLowerCase();
      if (sensitive.some((s) => lk.includes(s))) {
        out[k] = '[REDACTED]';
      } else if (v && typeof v === 'object') {
        out[k] = this.redact(v);
      } else {
        out[k] = v;
      }
    }
    return out;
  }
}
