import { EkycService } from './ekyc.service';
export declare class EkycController {
    private readonly s;
    constructor(s: EkycService);
    request(identityId: string, body: {
        clientId: string;
        level: string;
        purpose: string;
        retentionDays?: number;
    }): Promise<any>;
    approve(id: string, body: {
        attestationJws: string;
    }): Promise<any>;
    get(identityId: string, id: string, body: {
        clientId: string;
    }): Promise<any>;
    status(pairwiseSub: string): Promise<{
        pairwiseSub: string;
        status: string;
    }>;
}
