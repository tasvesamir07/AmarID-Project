import { PrismaService } from '../../common/prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(params: {
        actor?: string;
        action: string;
        subjectPseudonym?: string;
        metadata: Record<string, unknown>;
        prevHash: string;
    }): Promise<any>;
    getLastHash(): Promise<any>;
}
