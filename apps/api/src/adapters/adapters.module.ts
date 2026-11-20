import { Global, Module, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NidProvider,
  SimRegistry,
  LivenessProvider,
  FingerprintMatcher,
  SmsGateway,
  Mailer,
  DeceasedRegistry,
  NidResult,
  SimResult,
  LivenessResult,
  FingerprintResult,
} from '@amarid/shared';

export const NID_PROVIDER = Symbol('NID_PROVIDER');
export const SIM_REGISTRY = Symbol('SIM_REGISTRY');
export const LIVENESS_PROVIDER = Symbol('LIVENESS_PROVIDER');
export const FINGERPRINT_MATCHER = Symbol('FINGERPRINT_MATCHER');
export const SMS_GATEWAY = Symbol('SMS_GATEWAY');
export const MAILER = Symbol('MAILER');
export const DECEASED_REGISTRY = Symbol('DECEASED_REGISTRY');

/* ---------- Mock NID Provider ---------- */
@Injectable()
class MockNidProvider implements NidProvider {
  async verify(input: { docType: string; number: string; image?: Buffer }): Promise<NidResult> {
    // DEMO_SCENARIO can force mismatch/timeout/duplicate via env
    const scenario = process.env.DEMO_SCENARIO || 'success';
    if (scenario === 'timeout') throw new Error('NID provider timeout');
    if (scenario === 'mismatch') {
      return { verified: false, name: null, dob: null, docType: input.docType as any, matchScore: 0.1, reason: 'Name/DOB mismatch' };
    }
    // success: accept well-formed NID-like input, never store raw
    const verified = !!input.number && input.number.length >= 5;
    return {
      verified,
      name: verified ? 'Demo Citizen' : null,
      dob: verified ? '1990-01-01' : null,
      docType: input.docType as any,
      matchScore: verified ? 0.98 : null,
      reason: null,
    };
  }
}

/* ---------- Mock SIM Registry ---------- */
@Injectable()
class MockSimRegistry implements SimRegistry {
  async ownerMatches(msisdn: string, docRef: string): Promise<SimResult> {
    const scenario = process.env.DEMO_SCENARIO || 'success';
    if (scenario === 'timeout') throw new Error('SIM registry timeout');
    if (scenario === 'mismatch') {
      return { ownerMatches: false, operator: 'Grameenphone', reason: 'SIM not registered to document holder' };
    }
    return { ownerMatches: true, operator: 'Grameenphone', reason: null };
  }
}

/* ---------- Mock Liveness Provider ---------- */
@Injectable()
class MockLivenessProvider implements LivenessProvider {
  async verify(sessionId: string, _frame?: Buffer): Promise<LivenessResult> {
    const scenario = process.env.DEMO_SCENARIO || 'success';
    if (scenario === 'timeout') throw new Error('Liveness provider timeout');
    if (scenario === 'mismatch') {
      return { passed: false, score: 0.3, presentationAttackDetected: true, reason: 'Presentation attack detected' };
    }
    return { passed: true, score: 0.94, presentationAttackDetected: false, reason: null };
  }
}

/* ---------- Mock Fingerprint Matcher ---------- */
@Injectable()
class MockFingerprintMatcher implements FingerprintMatcher {
  async extract(raw: Buffer): Promise<{ template: Buffer }> {
    // In mock, produce a deterministic protected-ish template from raw (never store raw)
    const { createHash } = require('crypto');
    const template = createHash('sha256').update(raw).digest();
    return { template };
  }
  async match(probe: Buffer, enrolled: Buffer): Promise<FingerprintResult> {
    const scenario = process.env.DEMO_SCENARIO || 'success';
    if (scenario === 'mismatch') {
      return { matched: false, score: 0.2, templateId: null, reason: 'Fingerprint mismatch' };
    }
    return { matched: true, score: 0.91, templateId: null, reason: null };
  }
}

/* ---------- Console SMS Gateway (dev) ---------- */
@Injectable()
class ConsoleSmsGateway implements SmsGateway {
  async send(to: string, text: string): Promise<{ messageId: string }> {
    // eslint-disable-next-line no-console
    console.log(`[SMS MOCK] to=${to} body=${text}`);
    return { messageId: `mock-sms-${Date.now()}` };
  }
}

/* ---------- Dev Mailer (logs to console; Mailpit in docker) ---------- */
@Injectable()
class DevMailer implements Mailer {
  async send(message: { to: string; subject: string; html: string; text: string }): Promise<void> {
    // eslint-disable-next-line no-console
    console.log(`[EMAIL MOCK] to=${message.to} subject=${message.subject}`);
  }
}

/* ---------- Mock Deceased Registry ---------- */
@Injectable()
class MockDeceasedRegistry implements DeceasedRegistry {
  async check(_docRef: string) {
    return { deceased: false, source: null };
  }
}

@Global()
@Module({
  providers: [
    { provide: NID_PROVIDER, useClass: MockNidProvider },
    { provide: SIM_REGISTRY, useClass: MockSimRegistry },
    { provide: LIVENESS_PROVIDER, useClass: MockLivenessProvider },
    { provide: FINGERPRINT_MATCHER, useClass: MockFingerprintMatcher },
    { provide: SMS_GATEWAY, useClass: ConsoleSmsGateway },
    { provide: MAILER, useClass: DevMailer },
    { provide: DECEASED_REGISTRY, useClass: MockDeceasedRegistry },
  ],
  exports: [NID_PROVIDER, SIM_REGISTRY, LIVENESS_PROVIDER, FINGERPRINT_MATCHER, SMS_GATEWAY, MAILER, DECEASED_REGISTRY],
})
export class AdaptersModule {}
