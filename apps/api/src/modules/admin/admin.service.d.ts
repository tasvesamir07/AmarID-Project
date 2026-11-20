import { PrismaService } from '../../common/prisma/prisma.service';
export declare class AdminService {
    private prisma;
    constructor(prisma: PrismaService);
    metrics(): Promise<{
        identities: any;
        enrollments: any;
        totalConsents: any;
        ekyc: any;
    }>;
    createClient(data: {
        name: string;
        redirectUris: string[];
        scopes: string[];
        type: string;
        sectorIdentifier?: string;
        verifiedPartner?: boolean;
        tier?: string;
    }): Promise<any>;
    listClients(): Promise<any>;
}
