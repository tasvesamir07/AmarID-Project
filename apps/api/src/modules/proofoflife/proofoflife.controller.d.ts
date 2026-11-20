import { ProofOfLifeService } from './proofoflife.service';
export declare class ProofOfLifeController {
    private readonly s;
    constructor(s: ProofOfLifeService);
    start(identityId: string): Promise<{
        eventId: any;
        dueAt: Date;
    }>;
    complete(identityId: string, body: {
        method: string;
        passed: boolean;
    }): Promise<{
        passed: boolean;
        status: string;
    }>;
    status(identityId: string): Promise<{
        status: any;
        nextProofOfLifeDueAt: any;
        lastProofOfLifeAt: any;
    }>;
}
