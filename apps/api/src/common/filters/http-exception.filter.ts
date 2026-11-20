import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AmaridError } from '@amarid/shared';
import { toErrorEnvelope } from '@amarid/shared';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = (request as any).traceId || 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let isPublic = false;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;
      code = res?.code || 'HTTP_ERROR';
      message = res?.message || exception.message;
      isPublic = status < 500;
    } else if (exception instanceof AmaridError) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;
      isPublic = exception.isPublic;
    }

    // Log internal errors fully; public errors lightly
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} - ${status} ${code}`, (exception as Error).stack);
    } else {
      this.logger.warn(`${request.method} ${request.url} - ${status} ${code} - ${message}`);
    }

    const baseUrl = process.env.API_URL || 'http://localhost:4000';
    const envelope = toErrorEnvelope(
      { message, name: code, traceId } as Error,
      baseUrl,
    );
    // Override with our structured values
    envelope.code = code;
    envelope.traceId = traceId;
    envelope.detail = isPublic ? message : undefined;
    envelope.title = status >= 500 ? 'Server Error' : message;

    response.status(status).json({
      ...envelope,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
