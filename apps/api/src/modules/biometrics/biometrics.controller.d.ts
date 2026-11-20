import { BiometricsService } from './biometrics.service';
export declare class BiometricsController {
    private readonly s;
    constructor(s: BiometricsService);
    enroll(identityId: string, body: {
        modality: string;
        protectedBlob: string;
        keyVersion?: number;
    }): Promise<any>;
    templates(identityId: string): Promise<any>;
    dedupFace(identityId: string, body: {
        probe: string;
    }): Promise<{
        duplicate: boolean;
        bestScore: number;
        ambiguous: boolean;
    }>;
}
