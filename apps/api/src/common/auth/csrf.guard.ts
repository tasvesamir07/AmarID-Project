import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { cookieNames, parseCookies } from './cookies';

/**
 * Double-submit CSRF protection for cookie-authenticated mutating requests.
 *
 * The client reads the non-HttpOnly `amarid_csrf` cookie and echoes it in the
 * `x-csrf-token` header. A cross-site form/fetch cannot read the cookie, so it
 * cannot forge the header. Safe methods are always allowed. When no CSRF cookie
 * is present (e.g. the very first login request) the guard is permissive.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;

    const cookies = parseCookies(req.headers.cookie);
    const expected = cookies[cookieNames().csrf];
    if (!expected) return true;

    const provided = req.headers['x-csrf-token'];
    const token = Array.isArray(provided) ? provided[0] : provided;
    return typeof token === 'string' && token === expected;
  }
}
