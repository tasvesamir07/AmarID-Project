import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import { randomHex } from '@amarid/shared';

/** Convert a DER-encoded SubjectPublicKeyInfo to a PEM string. */
function derToPem(der: Uint8Array): string {
  const b64 = Buffer.from(der).toString('base64');
  const lines = b64.match(/.{1,64}/g) || [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----\n`;
}

/** Convert a PEM string back to DER bytes for SimpleWebAuthn. */
function pemToDer(pem: string): Uint8Array {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return new Uint8Array(Buffer.from(b64, 'base64'));
}

/**
 * Passkey (WebAuthn) registration and authentication.
 *
 * rpID/origin are configurable. Defaults target the local Next.js origin so the
 * browser ceremony on http://localhost:3000 validates against this API.
 */
@Injectable()
export class PasskeyService {
  private readonly logger = new Logger(PasskeyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private get rpID(): string {
    return process.env.WEBAUTHN_RP_ID || 'localhost';
  }

  private get origin(): string {
    return process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';
  }

  private regKey(identityId: string): string {
    return this.redis.key('webauthn', 'reg', identityId);
  }

  private authKey(identityId: string): string {
    return this.redis.key('webauthn', 'auth', identityId);
  }

  private setupKey(token: string): string {
    return this.redis.key('setup', token);
  }

  async issueSetupToken(identityId: string): Promise<string> {
    const token = randomHex(24);
    await this.redis.set(this.setupKey(token), identityId, 600);
    return token;
  }

  async createRegistrationOptions(setupToken: string) {
    const identityId = await this.peekSetupToken(setupToken);
    const identity = await this.prisma.identity.findUnique({
      where: { id: identityId },
      select: { universalId: true },
    });
    if (!identity) throw new NotFoundException('Identity not found');

    const opts = await generateRegistrationOptions({
      rpName: 'AmarID',
      rpID: this.rpID,
      userName: identity.universalId,
      userID: Buffer.from(identityId),
      userDisplayName: identity.universalId,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'required',
      },
      excludeCredentials: [],
    });

    await this.redis.set(this.regKey(identityId), opts.challenge, 300);
    return opts;
  }

  async verifyRegistration(
    setupToken: string,
    response: RegistrationResponseJSON,
  ) {
    const identityId = await this.consumeSetupToken(setupToken);
    const challenge = await this.redis.get(this.regKey(identityId));
    if (!challenge) throw new BadRequestException('OPTIONS_EXPIRED');

    let result;
    try {
      result = await verifyRegistrationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        requireUserVerification: true,
      });
    } catch (err) {
      this.logger.warn(`Passkey registration verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('PASSKEY_VERIFICATION_FAILED');
    }

    if (!result.verified || !result.registrationInfo) {
      throw new UnauthorizedException('PASSKEY_VERIFICATION_FAILED');
    }

    const credential = result.registrationInfo.credential;
    const device = await this.prisma.device.create({
      data: {
        identityId,
        webauthnCredentialId: credential.id,
        publicKeyPem: derToPem(credential.publicKey),
        signCount: credential.counter,
        transports: JSON.stringify(credential.transports || []),
        label: 'Primary device',
        lastUsedAt: new Date(),
      },
    });

    await this.redis.del(this.regKey(identityId));
    this.logger.log(`Registered passkey ${credential.id} for identity ${identityId}`);
    return device;
  }

  async createAuthenticationOptions(universalId: string) {
    const identity = await this.prisma.identity.findUnique({
      where: { universalId },
      select: {
        id: true,
        devices: { where: { revokedAt: null }, select: { webauthnCredentialId: true, transports: true } },
      },
    });
    if (!identity) throw new NotFoundException('Identity not found');
    if (identity.devices.length === 0) {
      throw new ForbiddenException('NO_PASSKEY_REGISTERED');
    }

    const opts = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials: identity.devices.map((d) => ({
        id: d.webauthnCredentialId,
        transports: this.parseTransports(d.transports),
      })),
      userVerification: 'required',
    });

    await this.redis.set(this.authKey(identity.id), opts.challenge, 300);
    return opts;
  }

  async verifyAuthentication(universalId: string, response: AuthenticationResponseJSON) {
    const identity = await this.prisma.identity.findUnique({
      where: { universalId },
      select: { id: true },
    });
    if (!identity) throw new NotFoundException('Identity not found');

    const credentialId = response.rawId || response.id;
    const device = await this.prisma.device.findFirst({
      where: { identityId: identity.id, webauthnCredentialId: credentialId },
    });
    if (!device) throw new UnauthorizedException('UNKNOWN_CREDENTIAL');

    const challenge = await this.redis.get(this.authKey(identity.id));
    if (!challenge) throw new BadRequestException('OPTIONS_EXPIRED');

    let result;
    try {
      result = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge,
        expectedOrigin: this.origin,
        expectedRPID: this.rpID,
        credential: {
          id: device.webauthnCredentialId,
          publicKey: pemToDer(device.publicKeyPem),
          counter: device.signCount,
          transports: this.parseTransports(device.transports),
        },
        requireUserVerification: true,
      });
    } catch (err) {
      this.logger.warn(`Passkey authentication verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('PASSKEY_VERIFICATION_FAILED');
    }

    if (!result.verified) {
      throw new UnauthorizedException('PASSKEY_VERIFICATION_FAILED');
    }

    await this.prisma.device.update({
      where: { id: device.id },
      data: {
        signCount: result.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });
    await this.redis.del(this.authKey(identity.id));
    return identity.id;
  }

  async listDevices(identityId: string) {
    return this.prisma.device.findMany({
      where: { identityId },
      select: {
        id: true,
        label: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async revokeDevice(identityId: string, deviceId: string) {
    const device = await this.prisma.device.findUnique({ where: { id: deviceId } });
    if (!device || device.identityId !== identityId) {
      throw new NotFoundException('Device not found');
    }
    return this.prisma.device.update({
      where: { id: deviceId },
      data: { revokedAt: new Date() },
    });
  }

  private async peekSetupToken(token: string): Promise<string> {
    const value = await this.redis.get(this.setupKey(token));
    if (!value) throw new ForbiddenException('SETUP_EXPIRED');
    return value;
  }

  private async consumeSetupToken(token: string): Promise<string> {
    const value = await this.redis.get(this.setupKey(token));
    if (!value) throw new ForbiddenException('SETUP_EXPIRED');
    await this.redis.del(this.setupKey(token));
    return value;
  }

  private parseTransports(raw: string | null): AuthenticatorTransportFuture[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as AuthenticatorTransportFuture[]) : [];
    } catch {
      return [];
    }
  }
}
