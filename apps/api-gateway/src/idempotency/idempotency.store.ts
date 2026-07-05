/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

const TTL_SECONDS = 60 * 60 * 24;
@Injectable()
export class IdempotencyStore implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IdempotencyStore.name);
  private redis: Redis;

  onModuleInit() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      lazyConnect: true,
    });

    this.redis.on('connect', () => this.logger.log('IdempotencyStore connected to Redis'));
    this.redis.on('error', (err) => this.logger.error('Redis error', err));
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async get(key: string): Promise<unknown | null> {
    const raw = await this.redis.get(`idempotency:${key}`);
    return raw ? (JSON.parse(raw) as unknown) : null;
  }

  async set(key: string, value: unknown): Promise<void> {
    await this.redis.set(
      `idempotency:${key}`,
      JSON.stringify(value),
      'EX',
      TTL_SECONDS,
    );
  }
}
