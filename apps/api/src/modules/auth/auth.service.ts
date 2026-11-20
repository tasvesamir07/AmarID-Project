import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'node:crypto';
import { Inject } from '@nestjs/common';
import { MAILER, SMS_GATEWAY } from '../../adapters/adapters.module';
import type { Mailer, SmsGateway } from '@amarid/shared';
import {
  constantTimeEqual,
  hmacSha256Hex,
  OTP,
  randomHex,
} from '@amarid/shared';
import { RedisService } from '../../common/redis/redis.service';

interface OtpRecord {
  v: string;
  purpose: string;
  channel: 'sms' | 'email';
  destination: string;
  enrollmentId?: string;
  attempts: number;
  resends: number;
  lockedUntil: number;
  resendAt: number;
  expiresAt: number;
}

const RESEND_COOLDOWNS = [60, 120, 300];

/** Strict OTP service implementing 03-AUTH-OTP-EMAIL.md. */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly redis: RedisService,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(SMS_GATEWAY) private readonly sms: SmsGateway,
    private readonly config: ConfigService,
  ) {}

  private get pepper(): string {
    return process.env.PEPPER_HEX || 'dev-pepper';
  }

  private key(challengeId: string): string {
    return this.redis.key('otp', challengeId);
  }

  private failedKey(channel: string, destination: string): string {
    return this.redis.key('otp', 'failed', channel, destination);
  }

  private lockKey(channel: string, destination: string): string {
    return this.redis.key('otp', 'lock', channel, destination);
  }

  async requestOtp(params: {
    purpose: string;
    channel: 'sms' | 'email';
    destination: string;
    ip: string;
    deviceFingerprint: string;
    enrollmentId?: string;
  }) {
    const { purpose, channel, destination, ip, deviceFingerprint, enrollmentId } = params;

    // Destination lockout after repeated failures across challenges.
    const lockedUntil = Number(await this.redis.get(this.lockKey(channel, destination)) || 0);
    if (lockedUntil && lockedUntil > Date.now()) {
      throw new ConflictException('OTP_LOCKED');
    }

    const hour = 3600;
    const day = 86400;
    const [destHour, destDay, ipHour, devHour] = await Promise.all([
      this.redis.incr(this.redis.key('otp', 'rate', 'dest-hour', channel, destination), hour),
      this.redis.incr(this.redis.key('otp', 'rate', 'dest-day', channel, destination), day),
      this.redis.incr(this.redis.key('otp', 'rate', 'ip', ip), hour),
      this.redis.incr(this.redis.key('otp', 'rate', 'dev', deviceFingerprint), hour),
    ]);
    if (
      destHour > OTP.destinationPerHour ||
      destDay > OTP.destinationPerDay ||
      ipHour > OTP.ipPerHour ||
      devHour > OTP.devicePerHour
    ) {
      throw new ConflictException('OTP_RATE_LIMITED');
    }

    const challengeId = randomHex(16);
    const code = this.generateCode();
    const ttl = channel === 'sms' ? OTP.smsTtlSeconds : OTP.emailTtlSeconds;
    const now = Date.now();

    const record: OtpRecord = {
      v: hmacSha256Hex(code + challengeId, this.pepper),
      purpose,
      channel,
      destination,
      enrollmentId,
      attempts: 0,
      resends: 0,
      lockedUntil: 0,
      resendAt: now + OTP.resendCooldownSeconds * 1000,
      expiresAt: now + ttl * 1000,
    };
    await this.redis.set(this.key(challengeId), JSON.stringify(record), ttl);

    await this.deliver(channel, destination, code, ttl);
    if (process.env.OTP_DEV_MODE === 'true') {
      this.logger.warn(`[DEV OTP] ${channel}=${destination} code=${code}`);
    }

    return {
      challengeId,
      expiresAt: new Date(record.expiresAt),
      resendAvailableAt: new Date(record.resendAt),
      // Return code in response when no real SMS/email provider configured (free demo mode)
      ...(process.env.OTP_DEV_MODE === 'true' ? { devCode: code } : {}),
    };
  }

  async verifyOtp(params: { challengeId: string; code: string }) {
    const { challengeId, code } = params;
    const raw = await this.redis.get(this.key(challengeId));
    if (!raw) throw new UnauthorizedException('OTP_INVALID');

    let record: OtpRecord;
    try {
      record = JSON.parse(raw);
    } catch {
      throw new UnauthorizedException('OTP_INVALID');
    }

    if (record.lockedUntil && record.lockedUntil > Date.now()) {
      throw new UnauthorizedException('OTP_LOCKED');
    }
    if (record.expiresAt < Date.now()) {
      await this.redis.del(this.key(challengeId));
      throw new UnauthorizedException('OTP_EXPIRED');
    }
    if (record.attempts >= OTP.maxVerifyAttempts) {
      record.lockedUntil = Date.now() + OTP.lockoutMinutes * 60 * 1000;
      await this.redis.set(
        this.key(challengeId),
        JSON.stringify(record),
        Math.ceil((record.expiresAt - Date.now()) / 1000),
      );
      throw new UnauthorizedException('OTP_LOCKED');
    }

    const expected = hmacSha256Hex(code + challengeId, this.pepper);
    if (!constantTimeEqual(record.v, expected)) {
      record.attempts += 1;
      const remaining = Math.max(1, Math.ceil((record.expiresAt - Date.now()) / 1000));
      await this.redis.set(this.key(challengeId), JSON.stringify(record), remaining);

      await this.registerFailure(record.channel, record.destination);
      throw new UnauthorizedException('OTP_INVALID');
    }

    await this.redis.del(this.key(challengeId));
    const proofToken = randomHex(24);
    await this.redis.set(
      this.redis.key('otp', 'proof', proofToken),
      JSON.stringify({
        purpose: record.purpose,
        channel: record.channel,
        destination: record.destination,
        enrollmentId: record.enrollmentId,
        verifiedAt: Date.now(),
      }),
      300,
    );
    return { verified: true, proofToken, purpose: record.purpose };
  }

  async resendOtp(challengeId: string) {
    const raw = await this.redis.get(this.key(challengeId));
    if (!raw) throw new UnauthorizedException('OTP_INVALID');

    let record: OtpRecord;
    try {
      record = JSON.parse(raw);
    } catch {
      throw new UnauthorizedException('OTP_INVALID');
    }
    if (record.lockedUntil && record.lockedUntil > Date.now()) {
      throw new ConflictException('OTP_LOCKED');
    }
    if (record.resends >= OTP.maxResends) {
      throw new ConflictException('OTP_RATE_LIMITED');
    }
    const now = Date.now();
    if (now < record.resendAt) {
      throw new ConflictException('OTP_RATE_LIMITED');
    }

    const cooldown = RESEND_COOLDOWNS[Math.min(record.resends, RESEND_COOLDOWNS.length - 1)];
    const code = this.generateCode();
    record.v = hmacSha256Hex(code + challengeId, this.pepper);
    record.attempts = 0;
    record.resends += 1;
    record.resendAt = now + cooldown * 1000;

    const remaining = Math.max(1, Math.ceil((record.expiresAt - now) / 1000));
    await this.redis.set(this.key(challengeId), JSON.stringify(record), remaining);
    await this.deliver(record.channel, record.destination, code, remaining);

    return {
      ok: true,
      resendAvailableAt: new Date(record.resendAt),
      expiresAt: new Date(record.expiresAt),
    };
  }

  async consumeProofToken(proofToken: string): Promise<{
    purpose: string;
    channel: string;
    destination: string;
    enrollmentId?: string;
  } | null> {
    const raw = await this.redis.get(this.redis.key('otp', 'proof', proofToken));
    if (!raw) return null;
    await this.redis.del(this.redis.key('otp', 'proof', proofToken));
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private generateCode(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }

  private async deliver(channel: 'sms' | 'email', destination: string, code: string, ttl: number) {
    if (channel === 'sms') {
      const minutes = Math.round(ttl / 60);
      await this.sms.send(
        destination,
        `AmarID: ${code} is your verification code. Valid for ${minutes} minutes. Never share it with anyone.\n@amarid.local #${code}`,
      );
    } else {
      const minutes = Math.round(ttl / 60);
      await this.mailer.send({
        to: destination,
        subject: 'AmarID verification code',
        text: `Your code is ${code}. Valid for ${minutes} minutes.`,
        html: `<p>Your code is <b>${code}</b>. Valid for ${minutes} minutes.</p>`,
      });
    }
  }

  private async registerFailure(channel: string, destination: string) {
    const count = await this.redis.incr(this.failedKey(channel, destination), 3600);
    if (count >= OTP.lockoutFailedThreshold) {
      await this.redis.set(
        this.lockKey(channel, destination),
        String(Date.now() + OTP.lockoutMinutes * 60 * 1000),
        OTP.lockoutMinutes * 60,
      );
      await this.redis.del(this.failedKey(channel, destination));
    }
  }
}
