import { PrismaService } from '../../common/prisma/prisma.service';
export declare class ProofOfLifeService {
    private prisma;
    constructor(prisma: PrismaService);
    start(identityId: string): Promise<{
        eventId: any;
        dueAt: Date;
    }>;
    complete(identityId: string, method: string, passed: boolean): Promise<{
        passed: boolean;
        status: string;
    }>;
    status(identityId: string): Promise<{
        status: any;
        nextProofOfLifeDueAt: any;
        lastProofOfLifeAt: any;
    }>;
}
