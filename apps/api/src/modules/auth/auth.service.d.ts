import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import type { Mailer, SmsGateway } from '@amarid/shared';
export declare class AuthService {
    private readonly prisma;
    private readonly redis;
    private readonly jwt;
    private readonly config;
    private readonly mailer;
    private readonly sms;
    private readonly logger;
    constructor(prisma: PrismaService, redis: RedisService, jwt: JwtService, config: ConfigService, mailer: Mailer, sms: SmsGateway);
    private pepper;
    requestOtp(params: {
        purpose: string;
        channel: 'sms' | 'email';
        destination: string;
        ip: string;
        deviceFingerprint: string;
    }): Promise<{
        challengeId: any;
        expiresAt: Date;
        resendAvailableAt: Date;
    }>;
    verifyOtp(params: {
        purpose: string;
        channel: 'sms' | 'email';
        destination: string;
        challengeId: string;
        code: string;
    }): Promise<{
        verified: boolean;
        proofToken: any;
    }>;
    resendOtp(challengeId: string): Promise<{
        ok: boolean;
    }>;
    issueSession(identityId: string): Promise<{
        accessToken: string;
        refreshToken: any;
        expiresIn: any;
    }>;
    verifyRefresh(identityId: string, refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: any;
        expiresIn: any;
    }>;
    revokeSession(identityId: string): Promise<void>;
}
