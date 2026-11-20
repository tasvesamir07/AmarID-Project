import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Protects admin-only routes with a shared admin key header.
 * Configure ADMIN_KEY in the environment; never commit a real value.
 */
@Injectable()
export class AdminKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const expected = process.env.ADMIN_KEY;
    if (!expected) {
      // Fail closed: if no admin key is configured, admin routes are unavailable.
      throw new ForbiddenException('ADMIN_KEY_NOT_CONFIGURED');
    }
    const provided = req.headers['x-admin-key'];
    const key = Array.isArray(provided) ? provided[0] : provided;
    if (key !== expected) throw new ForbiddenException('INVALID_ADMIN_KEY');
    return true;
  }
}
