import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
export declare class HealthController {
    private health;
    private db;
    constructor(health: HealthCheckService, db: TypeOrmHealthIndicator);
    check(): Promise<import("@nestjs/terminus").HealthCheckResult>;
    live(): {
        status: string;
        service: string;
        time: string;
    };
}
