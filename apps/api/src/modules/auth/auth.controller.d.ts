import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    requestOtp(body: any, req: any): Promise<{
        challengeId: any;
        expiresAt: Date;
        resendAvailableAt: Date;
    }>;
    verifyOtp(body: any): Promise<{
        verified: boolean;
        proofToken: any;
    }>;
    resendOtp(body: any): Promise<{
        ok: boolean;
    }>;
    issueSession(body: {
        identityId: string;
    }): Promise<{
        accessToken: string;
        refreshToken: any;
        expiresIn: any;
    }>;
    refresh(body: {
        identityId: string;
        refreshToken: string;
    }): Promise<{
        accessToken: string;
        refreshToken: any;
        expiresIn: any;
    }>;
    revoke(body: {
        identityId: string;
    }): Promise<void>;
}
