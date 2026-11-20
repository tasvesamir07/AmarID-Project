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

/* ---------- SMS Gateway: Twilio (prod) or console (dev) ---------- */
@Injectable()
class SmartSmsGateway implements SmsGateway {
  private readonly logger = new (require('@nestjs/common').Logger)('SmsGateway');
  constructor(private readonly config: ConfigService) {}

  async send(to: string, text: string): Promise<{ messageId: string }> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken  = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const fromNumber = this.config.get<string>('TWILIO_FROM_NUMBER');

    if (accountSid && authToken && fromNumber) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const body = new URLSearchParams({ To: to, From: fromNumber, Body: text });
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body,
        });
        const data: any = await resp.json();
        if (!resp.ok) throw new Error(data?.message || 'Twilio error');
        this.logger.log(`SMS sent to ${to} via Twilio: ${data.sid}`);
        return { messageId: data.sid };
      } catch (err: any) {
        this.logger.error(`Twilio SMS failed: ${err.message}`);
      }
    }
    // Fallback: log OTP to console (visible in Render logs)
    this.logger.warn(`[SMS CONSOLE] to=${to} | ${text}`);
    return { messageId: `console-sms-${Date.now()}` };
  }
}

/* ---------- Mailer: Resend (prod) or console (dev) ---------- */
@Injectable()
class SmartMailer implements Mailer {
  private readonly logger = new (require('@nestjs/common').Logger)('Mailer');
  constructor(private readonly config: ConfigService) {}

  async send(message: { to: string; subject: string; html: string; text: string }): Promise<void> {
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    const fromEmail    = this.config.get<string>('MAIL_FROM', 'AmarID <noreply@amarid.gov.bd>');

    if (resendApiKey) {
      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
          }),
        });
        const data: any = await resp.json();
        if (!resp.ok) throw new Error(data?.message || 'Resend error');
        this.logger.log(`Email sent to ${message.to} via Resend: ${data.id}`);
        return;
      } catch (err: any) {
        this.logger.error(`Resend email failed: ${err.message}`);
      }
    }
    // Fallback: log to console (visible in Render logs)
    this.logger.warn(`[EMAIL CONSOLE] to=${message.to} | subject=${message.subject} | ${message.text}`);
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
    { provide: SMS_GATEWAY, useClass: SmartSmsGateway },
    { provide: MAILER, useClass: SmartMailer },
    { provide: DECEASED_REGISTRY, useClass: MockDeceasedRegistry },
  ],
  exports: [NID_PROVIDER, SIM_REGISTRY, LIVENESS_PROVIDER, FINGERPRINT_MATCHER, SMS_GATEWAY, MAILER, DECEASED_REGISTRY],
})
export class AdaptersModule {}
