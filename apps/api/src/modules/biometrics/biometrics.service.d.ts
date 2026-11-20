import { PrismaService } from '../../common/prisma/prisma.service';
import type { FingerprintMatcher } from '@amarid/shared';
export declare class BiometricsService {
    private prisma;
    private finger;
    constructor(prisma: PrismaService, finger: FingerprintMatcher);
    enrollTemplate(identityId: string, modality: 'face' | 'finger', protectedBlob: Buffer, keyVersion?: number): Promise<any>;
    getTemplates(identityId: string): Promise<any>;
    dedupFace(identityId: string, probe: Buffer): Promise<{
        duplicate: boolean;
        bestScore: number;
        ambiguous: boolean;
    }>;
    private compare;
}
