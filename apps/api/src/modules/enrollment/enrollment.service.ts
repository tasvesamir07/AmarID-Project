import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { AeadService } from '../../common/crypto/aead.service';
import { AuditService } from '../audit/audit.service';
import { AuthService } from '../auth/auth.service';
import { BiometricsService } from '../biometrics/biometrics.service';
import {
  NID_PROVIDER,
  SIM_REGISTRY,
  LIVENESS_PROVIDER,
  FINGERPRINT_MATCHER,
} from '../../adapters/adapters.module';
import type {
  FingerprintMatcher,
  LivenessProvider,
  NidProvider,
  SimRegistry,
} from '@amarid/shared';
import { docHmac, maskUniversalId, msisdnHmac, randomHex } from '@amarid/shared';

const NEW_ENROLLMENT_SENTINEL = '00000000-0000-0000-0000-000000000000';

/** Onboarding state machine: real OTP, liveness, fingerprint, dedup, issuance. */
@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);
  private readonly pepper = process.env.PEPPER_HEX || 'dev-pepper';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly aead: AeadService,
    private readonly auth: AuthService,
    private readonly bio: BiometricsService,
    private readonly audit: AuditService,
    @Inject(NID_PROVIDER) private readonly nid: NidProvider,
    @Inject(SIM_REGISTRY) private readonly sim: SimRegistry,
    @Inject(LIVENESS_PROVIDER) private readonly live: LivenessProvider,
    @Inject(FINGERPRINT_MATCHER) private readonly finger: FingerprintMatcher,
  ) {}

  private k(enrollmentId: string, suffix: string): string {
    return this.redis.key('enroll', enrollmentId, suffix);
  }

  private async getEnrollment(id: string) {
    const e = await this.prisma.enrollment.findUnique({ where: { id } });
    if (!e) throw new NotFoundException('Enrollment not found');
    return e;
  }

  async start(p: { docType: string; docNumber: string; msisdn: string; email?: string; cfp: string }) {
    const docH = docHmac(p.docNumber, this.pepper);
    const existing = await this.prisma.identity.findUnique({ where: { docHmac: docH } });
    if (existing) throw new ConflictException('ENROLLMENT_DUPLICATE');

    const e = await this.prisma.enrollment.create({
      data: {
        state: 'STARTED',
        clientFingerprintHash: p.cfp,
        docHmac: docH,
        expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
      },
    });

    await this.audit.log({
      action: 'ENROLLMENT_STARTED',
      subjectPseudonym: e.id,
      metadata: { docType: p.docType },
      prevHash: await this.audit.getLastHash(),
    });

    return { enrollmentId: e.id, state: e.state, expiresAt: e.expiresAt };
  }

  async document(enrollmentId: string, input: { docType: string; number: string; image?: Buffer }) {
    const e = await this.getEnrollment(enrollmentId);
    if (e.state !== 'STARTED') throw new BadRequestException('INVALID_STATE');

    const r = await this.nid.verify({
      docType: input.docType,
      number: input.number,
      image: input.image,
    });
    if (!r.verified) {
      await this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { state: 'REJECTED_DOC' },
      });
      throw new BadRequestException('DOC_FAILED');
    }

    const docH = docHmac(input.number, this.pepper);
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { state: 'DOC_VERIFIED', docVerifiedAt: new Date(), docHmac: docH },
    });
    return { verified: true, docHmac: docH };
  }

  async simOtpRequest(
    enrollmentId: string,
    msisdn: string,
    ip: string,
    deviceFingerprint: string,
  ) {
    const e = await this.getEnrollment(enrollmentId);
    if (e.state !== 'DOC_VERIFIED') throw new BadRequestException('INVALID_STATE');

    const result = await this.auth.requestOtp({
      purpose: 'SIGNUP_SIM',
      channel: 'sms',
      destination: msisdn,
      enrollmentId,
      ip,
      deviceFingerprint,
    });
    await this.redis.set(this.k(enrollmentId, 'msisdn'), msisdn, 24 * 3600);
    return result;
  }

  async simOtpVerify(p: { enrollmentId: string; msisdn: string; challengeId: string; code: string }) {
    const e = await this.getEnrollment(p.enrollmentId);
    if (e.state !== 'DOC_VERIFIED') throw new BadRequestException('INVALID_STATE');

    await this.auth.verifyOtp({ challengeId: p.challengeId, code: p.code });

    const sr = await this.sim.ownerMatches(p.msisdn, p.enrollmentId);
    if (!sr.ownerMatches) {
      await this.prisma.enrollment.update({
        where: { id: p.enrollmentId },
        data: { state: 'REJECTED_DOC' },
      });
      throw new BadRequestException('SIM_MISMATCH');
    }

    const hash = msisdnHmac(p.msisdn, this.pepper);
    await this.prisma.enrollment.update({
      where: { id: p.enrollmentId },
      data: { state: 'SIM_VERIFIED', simVerifiedAt: new Date(), msisdnHmac: hash },
    });
    return { verified: true, msisdnHmac: hash };
  }

  async emailOtpRequest(
    enrollmentId: string,
    email: string,
    ip: string,
    deviceFingerprint: string,
  ) {
    const e = await this.getEnrollment(enrollmentId);
    if (e.state !== 'SIM_VERIFIED' && e.state !== 'EMAIL_VERIFIED') {
      throw new BadRequestException('INVALID_STATE');
    }
    const result = await this.auth.requestOtp({
      purpose: 'SIGNUP_EMAIL',
      channel: 'email',
      destination: email,
      enrollmentId,
      ip,
      deviceFingerprint,
    });
    await this.redis.set(this.k(enrollmentId, 'email'), email, 24 * 3600);
    return result;
  }

  async emailOtpVerify(p: { enrollmentId: string; email: string; challengeId: string; code: string }) {
    const e = await this.getEnrollment(p.enrollmentId);
    if (e.state !== 'SIM_VERIFIED' && e.state !== 'EMAIL_VERIFIED') {
      throw new BadRequestException('INVALID_STATE');
    }
    await this.auth.verifyOtp({ challengeId: p.challengeId, code: p.code });

    const normalized = p.email.trim().toLowerCase();
    const { hmacSha256Hex } = await import('@amarid/shared');
    const hash = hmacSha256Hex(this.pepper, normalized);
    await this.prisma.enrollment.update({
      where: { id: p.enrollmentId },
      data: { state: 'EMAIL_VERIFIED', emailHmac: hash },
    });
    return { verified: true, emailHmac: hash };
  }

  async livenessSession(enrollmentId: string) {
    const e = await this.getEnrollment(enrollmentId);
    if (e.state !== 'SIM_VERIFIED' && e.state !== 'EMAIL_VERIFIED') {
      throw new BadRequestException('INVALID_STATE');
    }
    const sessionId = `live-${randomHex(8)}`;
    await this.redis.set(this.k(enrollmentId, 'liveness'), sessionId, 1800);
    return { sessionId };
  }

  async livenessResult(p: { enrollmentId: string; sessionId: string; faceProbe?: string }) {
    const e = await this.getEnrollment(p.enrollmentId);
    if (e.state !== 'SIM_VERIFIED' && e.state !== 'EMAIL_VERIFIED') {
      throw new BadRequestException('INVALID_STATE');
    }
    const stored = await this.redis.get(this.k(p.enrollmentId, 'liveness'));
    if (!stored || stored !== p.sessionId) {
      throw new BadRequestException('LIVENESS_SESSION_INVALID');
    }

    const result = await this.live.verify(p.sessionId);
    if (!result.passed) {
      await this.prisma.enrollment.update({
        where: { id: p.enrollmentId },
        data: { state: 'REJECTED_LIVENESS' },
      });
      throw new BadRequestException('LIVENESS_FAILED');
    }

    if (p.faceProbe) {
      await this.redis.set(this.k(p.enrollmentId, 'face'), p.faceProbe, 1800);
    }
    await this.prisma.enrollment.update({
      where: { id: p.enrollmentId },
      data: { state: 'LIVENESS_PASSED', livenessPassedAt: new Date(), livenessScore: result.score },
    });
    return { passed: true, score: result.score };
  }

  async fingerprint(enrollmentId: string, templateBase64: string) {
    const e = await this.getEnrollment(enrollmentId);
    if (e.state !== 'LIVENESS_PASSED') throw new BadRequestException('INVALID_STATE');

    const raw = Buffer.from(templateBase64, 'base64');
    const extracted = await this.finger.extract(raw);
    const protectedBlob = this.bio.protectTemplate(extracted.template);
    await this.redis.set(
      this.k(enrollmentId, 'finger'),
      protectedBlob.toString('base64'),
      1800,
    );
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { state: 'FINGERPRINT_CAPTURED', fingerprintCapturedAt: new Date() },
    });
    return { captured: true };
  }

  async finalize(enrollmentId: string) {
    const e = await this.getEnrollment(enrollmentId);
    if (e.state !== 'FINGERPRINT_CAPTURED') throw new BadRequestException('INVALID_STATE');
    if (e.expiresAt < new Date()) {
      await this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { state: 'EXPIRED' },
      });
      throw new BadRequestException('ENROLLMENT_EXPIRED');
    }
    if (process.env.DEMO_SCENARIO === 'duplicate') {
      await this.prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { state: 'REJECTED_DUPLICATE' },
      });
      throw new ConflictException('DUPLICATE_IDENTITY');
    }
    if (!e.docHmac) throw new BadRequestException('DOC_MISSING');
    if (!e.msisdnHmac) throw new BadRequestException('SIM_MISSING');

    const fingerB64 = await this.redis.get(this.k(enrollmentId, 'finger'));
    const faceB64 = await this.redis.get(this.k(enrollmentId, 'face'));

    // 1:N biometric dedup before issuance.
    if (fingerB64) {
      await this.bio.dedup(NEW_ENROLLMENT_SENTINEL, 'finger', Buffer.from(fingerB64, 'base64'));
    }
    if (faceB64) {
      await this.bio.dedup(NEW_ENROLLMENT_SENTINEL, 'face', Buffer.from(faceB64, 'base64'));
    }

    const msisdn = (await this.redis.get(this.k(enrollmentId, 'msisdn'))) || '';
    const email = (await this.redis.get(this.k(enrollmentId, 'email'))) || '';

    const uid = `AID-${randomHex(2).toUpperCase()}-${randomHex(2).toUpperCase()}-${randomHex(2).toUpperCase()}`;

    const identity = await this.prisma.identity.create({
      data: {
        universalId: uid,
        docHmac: e.docHmac,
        status: 'ACTIVE',
        assuranceLevel: 'LOA3',
        issuedAt: new Date(),
        lastProofOfLifeAt: new Date(),
        nextProofOfLifeDueAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      },
    });

    if (msisdn) {
      await this.prisma.simBinding.create({
        data: {
          identityId: identity.id,
          msisdnHmac: e.msisdnHmac!,
          msisdnEnc: this.aead.encrypt(msisdn, identity.id),
          verifiedAt: new Date(),
          active: true,
        },
      });
    }
    if (email && e.emailHmac) {
      await this.prisma.contact.create({
        data: {
          identityId: identity.id,
          emailHmac: e.emailHmac,
          emailEnc: this.aead.encrypt(email, identity.id),
          verifiedAt: new Date(),
        },
      });
    }
    if (faceB64) {
      const protectedFace = this.bio.protectTemplate(Buffer.from(faceB64, 'base64'));
      await this.bio.enrollTemplate(identity.id, 'FACE', protectedFace);
    }
    if (fingerB64) {
      await this.bio.enrollTemplate(identity.id, 'FINGER', Buffer.from(fingerB64, 'base64'));
    }

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { state: 'ISSUED', identityId: identity.id, dedupCheckedAt: new Date() },
    });

    const setupToken = randomHex(24);
    await this.redis.set(this.redis.key('setup', setupToken), identity.id, 600);

    for (const suffix of ['msisdn', 'email', 'face', 'finger', 'liveness']) {
      await this.redis.del(this.k(enrollmentId, suffix));
    }

    await this.audit.log({
      action: 'IDENTITY_ISSUED',
      subjectPseudonym: identity.id,
      metadata: { universalId: uid },
      prevHash: await this.audit.getLastHash(),
    });

    this.logger.log(`Issued Universal ID ${uid} for enrollment ${enrollmentId}`);

    return {
      universalId: uid,
      maskedId: maskUniversalId(uid),
      status: 'ACTIVE',
      assuranceLevel: 'LOA3',
      setupToken,
    };
  }
}
