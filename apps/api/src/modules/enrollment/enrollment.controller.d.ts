import { EnrollmentService } from './enrollment.service';
export declare class EnrollmentController {
    private readonly s;
    constructor(s: EnrollmentService);
    start(body: any): Promise<{
        enrollmentId: any;
        state: any;
        expiresAt: any;
    }>;
    document(id: string, body: any): Promise<{
        verified: boolean;
        docHmac: any;
    }>;
    simOtpRequest(id: string, body: any): Promise<{
        challengeId: string;
        expiresAt: Date;
    }>;
    simOtpVerify(id: string, body: any): Promise<{
        verified: boolean;
        msisdnHmac: any;
    }>;
    livenessSession(id: string): Promise<{
        sessionId: string;
    }>;
    livenessResult(id: string, body: any): Promise<{
        passed: boolean;
    }>;
    fingerprint(id: string, body: any): Promise<{
        captured: boolean;
    }>;
    finalize(id: string): Promise<{
        universalId: string;
        maskedId: string;
        status: string;
        assuranceLevel: string;
    }>;
}
