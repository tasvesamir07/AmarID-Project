import { PrismaService } from '../../common/prisma/prisma.service';
export declare class ConsentService {
    private prisma;
    constructor(prisma: PrismaService);
    grant(identityId: string, clientId: string, scopes: string[], ttlDays?: number): Promise<any>;
    revoke(identityId: string, consentId: string): Promise<any>;
    list(identityId: string): Promise<any>;
    isValid(identityId: string, clientId: string, scope: string): Promise<boolean>;
}
