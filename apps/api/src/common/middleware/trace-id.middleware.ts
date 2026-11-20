import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

/**
 * Assigns a traceId to every request for structured logging & error correlation.
 */
@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    (req as any).traceId = req.headers['x-trace-id'] as string || randomUUID();
    next();
  }
}
