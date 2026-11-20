import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { importPKCS8, SignJWT } from 'jose';
import { CryptoKeyService } from '../crypto/crypto-key.service';
import { RedisService } from '../redis/redis.service';
import { randomHex, sha256Hex } from '@amarid/shared';
import {
  appendSetCookie,
  clearCookie,
  cookieNames,
  REFRESH_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
  serializeCookie,
} from './cookies';

/**
 * Cookie-based session lifecycle:
 *   - short-lived ES256 access token (HttpOnly)
 *   - rotating opaque refresh token (HttpOnly, stored hashed in Redis)
 *   - double-submit CSRF token (readable by the SPA)
 *
 * Refresh tokens are single-use and rotated on every refresh. Presenting an
 * already-rotated token triggers family revocation (reuse detection).
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly keys: CryptoKeyService,
  ) {}

  private get accessTtl(): number {
    return SESSION_MAX_AGE_SECONDS();
  }

  private get refreshTtl(): number {
    return REFRESH_MAX_AGE_SECONDS();
  }

  private refreshKey(hash: string): string {
    return this.redis.key('session', 'refresh', hash);
  }

  private usedKey(hash: string): string {
    return this.redis.key('session', 'used', hash);
  }

  private userKey(identityId: string): string {
    return this.redis.key('session', 'user', identityId);
  }

  async issueSession(res: Response, identityId: string): Promise<{ csrfToken: string }> {
    const sid = randomHex(16);
    const accessToken = await this.signAccessToken(identityId, sid);
    const refreshToken = randomHex(32);
    const hash = sha256Hex(refreshToken);

    await this.redis.set(
      this.refreshKey(hash),
      JSON.stringify({ identityId, sid }),
      this.refreshTtl,
    );
    await this.redis.clientOrThrow.sadd(this.userKey(identityId), hash);
    await this.redis.clientOrThrow.expire(this.userKey(identityId), this.refreshTtl);

    const csrfToken = randomHex(16);
    this.setCookies(res, accessToken, refreshToken, csrfToken);
    return { csrfToken };
  }

  async refresh(res: Response, refreshToken: string): Promise<{ csrfToken: string }> {
    const hash = sha256Hex(refreshToken);
    const raw = await this.redis.get(this.refreshKey(hash));
    if (!raw) {
      // Reuse detection: an already-rotated token means the family is compromised.
      const reused = await this.redis.get(this.usedKey(hash));
      if (reused) {
        const identityId = String(reused);
        this.logger.warn(`Refresh token reuse detected for identity ${identityId}; revoking family`);
        await this.revokeAll(identityId);
      }
      throw new UnauthorizedException('SESSION_EXPIRED');
    }

    let parsed: { identityId: string; sid: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new UnauthorizedException('SESSION_EXPIRED');
    }

    // Mark the presented token as used, then delete it (single-use).
    await this.redis.set(this.usedKey(hash), parsed.identityId, this.refreshTtl);
    await this.redis.del(this.refreshKey(hash));
    await this.redis.clientOrThrow.srem(this.userKey(parsed.identityId), hash);

    return this.issueSession(res, parsed.identityId);
  }

  async logout(res: Response, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const hash = sha256Hex(refreshToken);
      const raw = await this.redis.get(this.refreshKey(hash));
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          await this.redis.clientOrThrow.srem(this.userKey(parsed.identityId), hash);
        } catch {
          /* ignore malformed entry */
        }
      }
      await this.redis.del(this.refreshKey(hash));
    }
    const names = cookieNames();
    clearCookie(res, names.access);
    clearCookie(res, names.refresh);
    clearCookie(res, names.csrf);
  }

  async revokeAll(identityId: string): Promise<void> {
    const members = await this.redis.clientOrThrow.smembers(this.userKey(identityId));
    for (const hash of members) {
      await this.redis.del(this.refreshKey(hash));
    }
    await this.redis.del(this.userKey(identityId));
  }

  private async signAccessToken(identityId: string, sid: string): Promise<string> {
    const privateKey = await importPKCS8(this.keys.getPrivateKeyPem(), 'ES256');
    const issuer = process.env.OIDC_ISSUER || 'http://localhost:4000';
    return new SignJWT({ sub: identityId, sid, typ: 'access' })
      .setProtectedHeader({ alg: 'ES256', kid: this.keys.getKeyId() })
      .setIssuer(issuer)
      .setIssuedAt()
      .setExpirationTime(`${this.accessTtl}s`)
      .sign(privateKey);
  }

  private setCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
    csrfToken: string,
  ): void {
    const names = cookieNames();
    appendSetCookie(
      res,
      serializeCookie(names.access, accessToken, {
        maxAgeSeconds: this.accessTtl,
        httpOnly: true,
        sameSite: 'lax',
      }),
    );
    appendSetCookie(
      res,
      serializeCookie(names.refresh, refreshToken, {
        maxAgeSeconds: this.refreshTtl,
        httpOnly: true,
        sameSite: 'lax',
      }),
    );
    appendSetCookie(
      res,
      serializeCookie(names.csrf, csrfToken, {
        maxAgeSeconds: this.refreshTtl,
        httpOnly: false,
        sameSite: 'lax',
      }),
    );
  }
}
