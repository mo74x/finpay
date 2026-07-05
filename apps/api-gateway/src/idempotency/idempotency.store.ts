import { Injectable } from '@nestjs/common';

/**
 * Singleton in-memory idempotency store.
 *
 * Registered as a provider in AppModule so it is shared across
 * all requests (unlike @UseInterceptors which creates a new instance
 * per route, causing the cache to never persist between calls).
 *
 * For true production use, swap the Map for a Redis store with a TTL.
 */
@Injectable()
export class IdempotencyStore {
  private readonly cache = new Map<string, unknown>();

  has(key: string): boolean {
    return this.cache.has(key);
  }

  get(key: string): unknown {
    return this.cache.get(key);
  }

  set(key: string, value: unknown): void {
    this.cache.set(key, value);
  }
}
