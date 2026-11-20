import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { randomHex, sha256Hex } from '@amarid/shared';

@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);
  private signingKey: any;
  private jwks: any;

  constructor(private prisma: PrismaService, private redis: RedisService) { this.initKeys(); }

  private async initKeys() {
    const { generateKeyPair, exportJWK } = await import('jose');
    const pair = await generateKeyPair('ES256');
    const pubJWK = await exportJWK(pair.publicKey);
    this.signingKey = pair.privateKey;
    this.jwks = { keys: [{ ...pubJWK, alg: 'ES256', use: 'sig', kid: 'amarid-v1' }] };
  }

  getJwks() { return this.jwks; }

  getDiscovery(issuer: string) {
    return {
      issuer,
      authorization_endpoint: `${issuer}/authorize`,
      token_endpoint: `${issuer}/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/jwks.json`,
      scopes_supported: ['openid', 'profile.name', 'age.over_18', 'contact.phone_verified', 'uniqueness.promo', 'kyc.level', 'status.active', 'offline_access'],
      response_types_supported: ['code'],
      subject_types_supported: ['pairwise'],
      id_token_signing_alg_values_supported: ['ES256'],
      code_challenge_methods_supported: ['S256'],
    };
  }

  async authorize(p: { client_id: string; redirect_uri: string; scope: string; state: string; nonce: string; code_challenge: string; identityId: string }) {
    const client = await this.prisma.oidcClient.findUnique({ where: { clientId: p.client_id } });
    if (!client) throw new NotFoundException('Unknown client');
    if (!client.redirectUris.includes(p.redirect_uri)) throw new ForbiddenException('Redirect mismatch');
    const reqId = randomHex(16);
    await this.redis.set(this.redis.key('oidc', 'authreq', reqId), JSON.stringify(p), 600);
    return { requestId: reqId, client: { name: client.name }, scopes: p.scope.split(' ') };
  }

  async consent(requestId: string, identityId: string, approve: boolean, scopes: string[]) {
    const raw = await this.redis.get(this.redis.key('oidc', 'authreq', requestId));
    if (!raw) throw new NotFoundException('Request expired');
    const req = JSON.parse(raw);
    if (req.identityId !== identityId) throw new ForbiddenException('Not your request');
    if (!approve) { await this.redis.del(this.redis.key('oidc', 'authreq', requestId)); return { approved: false }; }
    const code = randomHex(24);
    await this.redis.set(this.redis.key('oidc', 'code', code), JSON.stringify({ ...req, approvedScopes: scopes.join(' ') }), 600);
    await this.redis.del(this.redis.key('oidc', 'authreq', requestId));
    return { approved: true, code, redirect_uri: req.redirect_uri, state: req.state };
  }

  async token(p: { grant_type: string; code?: string; code_verifier?: string; redirect_uri?: string; client_id: string; refresh_token?: string }) {
    const { grant_type, code, code_verifier, client_id } = p;
    if (grant_type !== 'authorization_code') throw new BadRequestException('Unsupported grant');
    if (!code || !code_verifier) throw new BadRequestException('Missing code/verifier');
    const raw = await this.redis.get(this.redis.key('oidc', 'code', code));
    if (!raw) throw new NotFoundException('Invalid/expired code');
    const req = JSON.parse(raw);
    if (req.client_id !== client_id) throw new ForbiddenException('Client mismatch');
    if (sha256Hex(code_verifier) !== req.code_challenge) throw new ForbiddenException('PKCE mismatch');
    const tokens = await this.issueTokens(req.identityId, client_id, req.approvedScopes || req.scope, req.nonce);
    await this.redis.del(this.redis.key('oidc', 'code', code));
    return tokens;
  }

  private async issueTokens(identityId: string, clientId: string, scopes: string, nonce: string) {
    const { SignJWT } = await import('jose');
    const client = await this.prisma.oidcClient.findUnique({ where: { clientId } });
    const sector = client?.sectorIdentifier || clientId;
    const sub = sha256Hex(`${identityId}|${sector}`); // pairwise sub
    const issuer = process.env.OIDC_ISSUER || 'http://localhost:4000';
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'ES256', kid: 'amarid-v1' };
    const accessToken = await new SignJWT({ sub, clientId, scopes }).setProtectedHeader(header as any).setIssuer(issuer).setSubject(sub).setAudience(clientId).setIssuedAt(now).setExpirationTime(now + 600).sign(this.signingKey);
    const idToken = await new SignJWT({ sub, clientId, scopes, nonce, acr: 'aid:loa3', auth_time: now }).setProtectedHeader(header as any).setIssuer(issuer).setSubject(sub).setAudience(clientId).setIssuedAt(now).setExpirationTime(now + 900).sign(this.signingKey);
    const refreshToken = randomHex(32);
    await this.redis.set(this.redis.key('oidc', 'refresh', refreshToken), JSON.stringify({ sub, clientId, scopes }), 30 * 86400);
    return { access_token: accessToken, id_token: idToken, refresh_token: refreshToken, token_type: 'Bearer', expires_in: 600 };
  }

  async userinfo(accessToken: string) {
    const { jwtVerify, importSPKI } = await import('jose');
    const pair = (await importSPKI(this.jwks.keys[0] as any, 'ES256')) as any;
    const { payload } = await jwtVerify(accessToken, pair.publicKey, { algorithms: ['ES256'] });
    return { sub: payload.sub, acr: 'aid:loa3', name_verified: true, age_over_18: true, phone_verified: true, status_active: true };
  }
}
