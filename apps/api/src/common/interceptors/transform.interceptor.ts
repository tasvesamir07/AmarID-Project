import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Standardizes successful responses:
 * { success: true, traceId, data, timestamp }
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const traceId = (req as any).traceId || 'unknown';
    return next.handle().pipe(
      map((data) => ({
        success: true,
        traceId,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}
