import { IdentityService } from './identity.service';
export declare class IdentityController {
    private readonly identity;
    constructor(identity: IdentityService);
    me(identityId: string): Promise<any>;
    card(identityId: string): Promise<{
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
    status(universalId: string): Promise<{
        universalId: string;
        status: string;
    }>;
    suspend(id: string, body: {
        reason: string;
    }): Promise<any>;
}
