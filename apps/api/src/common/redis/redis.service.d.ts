import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
/**
 * Redis service for OTP challenges, rate limiting, sessions, and challenges.
 * All keys namespaced with `amarid:` prefix.
 */
export declare class RedisService {
    private readonly config;
    private readonly logger;
    private client;
    constructor(config: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<"OK">;
    get clientOrThrow(): Redis;
    key(...parts: string[]): string;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    incr(key: string, ttlSeconds?: number): Promise<number>;
    getdel(key: string): Promise<string | null>;
}
