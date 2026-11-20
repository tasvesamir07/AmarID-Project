import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis, { type Redis as RedisClient } from 'ioredis';
import { ConfigService } from '@nestjs/config';

/**
 * Redis service for OTP challenges, rate limiting, sessions, and challenges.
 * All keys namespaced with `amarid:` prefix.
 */
@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClient | null = null;
  private connected = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL');

    const options = redisUrl
      ? {
          // Full URL provided (Render / production)
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
        }
      : {
          // Local dev fallback
          host: this.config.get('REDIS_HOST', 'localhost'),
          port: Number(this.config.get('REDIS_PORT', 6379)),
          lazyConnect: true,
          maxRetriesPerRequest: 3,
          enableOfflineQueue: false,
        };

    this.client = redisUrl ? new Redis(redisUrl, options) : new Redis(options);

    this.client.on('error', (err: Error) => {
      this.logger.error('Redis error', err.message);
    });

    this.client.on('connect', () => {
      this.connected = true;
      this.logger.log('Connected to Redis');
    });

    // Connect but don't crash if Redis is unavailable
    this.client.connect().catch((err: Error) => {
      this.logger.warn(`Redis connection failed (non-fatal): ${err.message}`);
    });
  }

  onModuleDestroy() {
    return this.client?.quit().catch(() => {});
  }

  get clientOrThrow() {
    if (!this.client) throw new Error('Redis not initialized');
    return this.client;
  }

  key(...parts: string[]): string {
    return `amarid:${parts.join(':')}`;
  }

  async get(key: string): Promise<string | null> {
    if (!this.connected) return null;
    return this.clientOrThrow.get(key).catch(() => null);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.connected) return;
    if (ttlSeconds) {
      await this.clientOrThrow.setex(key, ttlSeconds, value).catch(() => {});
    } else {
      await this.clientOrThrow.set(key, value).catch(() => {});
    }
  }

  async del(key: string): Promise<void> {
    if (!this.connected) return;
    await this.clientOrThrow.del(key).catch(() => {});
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.connected) return 0;
    const multi = this.clientOrThrow.multi();
    multi.incr(key);
    if (ttlSeconds) multi.expire(key, ttlSeconds);
    const execResult = await multi.exec().catch(() => null);
    const results = (execResult as [Error | null, unknown][]) ?? [];
    return (results[0]?.[1] as number) ?? 0;
  }

  // Atomic get-and-delete (OTP single-use, Lua-safe via GETDEL)
  async getdel(key: string): Promise<string | null> {
    if (!this.connected) return null;
    return this.clientOrThrow.getdel(key).catch(() => null);
  }
}
