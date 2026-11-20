import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { importSPKI, jwtVerify } from 'jose';
import { CryptoKeyService } from '../crypto/crypto-key.service';
import { Public } from './public.decorator';
import { cookieNames, parseCookies } from './cookies';

/**
 * Global authentication guard. Routes marked @Public() bypass it.
 * Verifies ES256 access tokens with the configured public key.
 */
@Injectable()
export class JwtAuthGuard {
  constructor(
    private readonly reflector: Reflector,
    private readonly keys: CryptoKeyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const handler = context.getHandler();
    const ctor = context.getClass();
    const isPublic =
      this.reflector.get<boolean>('isPublic', handler) ??
      this.reflector.get<boolean>('isPublic', ctor);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    let token = '';
    const header = req.headers.authorization || '';
    const [scheme, bearerToken] = header.split(' ');
    if (scheme === 'Bearer' && bearerToken) {
      token = bearerToken;
    } else {
      const cookies = req.headers.cookie ? parseCookies(req.headers.cookie) : {};
      token = cookies[cookieNames().access] || '';
    }

    if (!token) {
      throw new UnauthorizedException('UNAUTHORIZED');
    }

    try {
      const publicKey = await importSPKI(this.keys.getPublicKeyPem(), 'ES256');
      const issuer = process.env.OIDC_ISSUER || 'http://localhost:4000';
      const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ['ES256'],
        issuer,
      });
      if (payload.typ !== 'access' || typeof payload.sub !== 'string') {
        throw new Error('invalid token payload');
      }
      (req as any).user = { sub: payload.sub, sid: payload.sid, typ: payload.typ };
      return true;
    } catch {
      throw new UnauthorizedException('UNAUTHORIZED');
    }
  }
}
