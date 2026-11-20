import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
/**
 * Assigns a traceId to every request for structured logging & error correlation.
 */
export declare class TraceIdMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction): void;
}
