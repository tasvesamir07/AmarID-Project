import { PrismaService } from '../../common/prisma/prisma.service';
export declare class IdentityService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getProfile(identityId: string): Promise<any>;
    getCard(identityId: string): Promise<{
        maskedId: any;
        status: any;
        assuranceLevel: any;
        issuedAt: any;
        nextProofOfLifeInDays: any;
        verificationBadges: {
            modality: string;
            verified: boolean;
        }[];
    }>;
    suspend(identityId: string, reason: string): Promise<any>;
    revoke(identityId: string): Promise<any>;
}
