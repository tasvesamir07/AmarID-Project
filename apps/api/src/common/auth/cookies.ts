import { Response } from 'express';

/**
 * Cookie helpers for the session scheme.
 *
 * Cookie names use the `__Host-` prefix in production (which also forces Secure,
 * no Domain, and Path=/). In local dev over http we fall back to unprefixed names
 * because `__Host-` requires the Secure attribute.
 */

export interface CookieOptions {
  maxAgeSeconds?: number;
  httpOnly?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
  path?: string;
}

export function isSecureCookies(): boolean {
  return (process.env.NODE_ENV || 'development').toLowerCase() === 'production';
}

export function cookieNames(): { access: string; refresh: string; csrf: string } {
  const prefix = isSecureCookies() ? '__Host-' : '';
  return {
    access: `${prefix}amarid_at`,
    refresh: `${prefix}amarid_rt`,
    csrf: 'amarid_csrf',
  };
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  }
  return out;
}

export function serializeCookie(name: string, value: string, opts: CookieOptions = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path || '/'}`);
  if (opts.maxAgeSeconds !== undefined) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(opts.maxAgeSeconds))}`);
    parts.push(`Expires=${new Date(Date.now() + opts.maxAgeSeconds * 1000).toUTCString()}`);
  }
  parts.push(`SameSite=${opts.sameSite || 'Lax'}`);
  if (opts.httpOnly !== false) parts.push('HttpOnly');
  if (opts.secure ?? isSecureCookies()) parts.push('Secure');
  return parts.join('; ');
}

export function appendSetCookie(res: Response, cookie: string): void {
  const existing = res.getHeader('Set-Cookie');
  if (!existing) {
    res.setHeader('Set-Cookie', [cookie]);
    return;
  }
  const list = Array.isArray(existing) ? existing.map(String) : [String(existing)];
  list.push(cookie);
  res.setHeader('Set-Cookie', list);
}

export function clearCookie(res: Response, name: string): void {
  const prefix = isSecureCookies() ? '__Host-' : '';
  const base = name.startsWith(prefix) ? name : `${prefix}${name}`;
  appendSetCookie(res, serializeCookie(base, '', { maxAgeSeconds: 0, httpOnly: true }));
}

export const SESSION_MAX_AGE_SECONDS = () =>
  Number(process.env.SESSION_ACCESS_TTL_SECONDS || 600);

export const REFRESH_MAX_AGE_SECONDS = () =>
  Number(process.env.SESSION_REFRESH_TTL_SECONDS || 30 * 24 * 3600);
