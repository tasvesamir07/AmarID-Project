import { PrismaService } from '../../common/prisma/prisma.service';
import type { NidProvider, SimRegistry, LivenessProvider, FingerprintMatcher } from '@amarid/shared';
export declare class EnrollmentService {
    private prisma;
    private nid;
    private sim;
    private live;
    private finger;
    constructor(prisma: PrismaService, nid: NidProvider, sim: SimRegistry, live: LivenessProvider, finger: FingerprintMatcher);
    start(p: {
        docType: string;
        docNumber: string;
        msisdn: string;
        email?: string;
        cfp: string;
    }): Promise<{
        enrollmentId: any;
        state: any;
        expiresAt: any;
    }>;
    document(enrollmentId: string, input: {
        docType: string;
        number: string;
        image?: Buffer;
    }): Promise<{
        verified: boolean;
        docHmac: any;
    }>;
    simOtpRequest(enrollmentId: string, msisdn: string): Promise<{
        challengeId: string;
        expiresAt: Date;
    }>;
    simOtpVerify(p: {
        enrollmentId: string;
        msisdn: string;
        challengeId: string;
        code: string;
    }): Promise<{
        verified: boolean;
        msisdnHmac: any;
    }>;
    livenessSession(enrollmentId: string): Promise<{
        sessionId: string;
    }>;
    livenessResult(p: {
        enrollmentId: string;
        sessionId: string;
        passed: boolean;
    }): Promise<{
        passed: boolean;
    }>;
    fingerprint(enrollmentId: string, template: string): Promise<{
        captured: boolean;
    }>;
    finalize(enrollmentId: string): Promise<{
        universalId: string;
        maskedId: string;
        status: string;
        assuranceLevel: string;
    }>;
}
