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
  private client: RedisClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.client = new Redis({
      host: this.config.get('REDIS_HOST', 'localhost'),
      port: this.config.get('REDIS_PORT', 6379),
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });
    this.client.connect().then(() => this.logger.log('Connected to Redis'));
    this.client.on('error', (err: Error) => this.logger.error('Redis error', err.message));
  }

  onModuleDestroy() {
    return this.client?.quit();
  }

  get clientOrThrow() {
    if (!this.client) throw new Error('Redis not initialized');
    return this.client;
  }

  key(...parts: string[]): string {
    return `amarid:${parts.join(':')}`;
  }

  async get(key: string): Promise<string | null> {
    return this.clientOrThrow.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.clientOrThrow.setex(key, ttlSeconds, value);
    } else {
      await this.clientOrThrow.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.clientOrThrow.del(key);
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const multi = this.clientOrThrow.multi();
    multi.incr(key);
    if (ttlSeconds) multi.expire(key, ttlSeconds);
    const execResult = await multi.exec();
    const results = (execResult as [Error | null, unknown][]) ?? [];
    return (results[0]?.[1] as number) ?? 0;
  }

  // Atomic get-and-delete (OTP single-use, Lua-safe via GETDEL)
  async getdel(key: string): Promise<string | null> {
    return this.clientOrThrow.getdel(key);
  }
}
