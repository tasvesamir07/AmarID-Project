import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly s;
    constructor(s: AdminService);
    metrics(): Promise<{
        identities: any;
        enrollments: any;
        totalConsents: any;
        ekyc: any;
    }>;
    createClient(body: any): Promise<any>;
    listClients(): Promise<any>;
}
