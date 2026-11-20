import { PrismaService } from '../../common/prisma/prisma.service';
import { ConsentService } from '../consent/consent.service';
export declare class EkycService {
    private prisma;
    private consent;
    constructor(prisma: PrismaService, consent: ConsentService);
    request(clientId: string, identityId: string, level: string, purpose: string, retentionDays?: number): Promise<any>;
    approve(requestId: string, attestationJws: string): Promise<any>;
    get(requestId: string, clientId: string): Promise<any>;
    status(pairwiseSub: string): Promise<{
        pairwiseSub: string;
        status: string;
    }>;
}
