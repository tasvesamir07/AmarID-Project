import { ConsentService } from './consent.service';
export declare class ConsentController {
    private readonly s;
    constructor(s: ConsentService);
    grant(identityId: string, body: {
        clientId: string;
        scopes: string[];
        ttlDays?: number;
    }): Promise<any>;
    list(identityId: string): Promise<any>;
    revoke(identityId: string, id: string): Promise<any>;
}
