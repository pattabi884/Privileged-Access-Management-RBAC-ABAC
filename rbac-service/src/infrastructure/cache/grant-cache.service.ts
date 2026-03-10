import { REDIS_CLIENT } from '@infrastructure/redis/redis.module';
import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
//mport { REDIS_CLIENT } from '../redis/redis.module';

@Injectable()
export class GrantCacheService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redis: Redis,
  ) {}

  private key(userId: string, resource: string): string {
    return `grant:${userId}:${resource}`;
  }

  async setGrant(
    userId: string,
    resource: string,
    requestId: string,
    ttlSeconds: number,
  ): Promise<void> {
    const k = this.key(userId, resource);

    if (ttlSeconds > 0) {
      await this.redis.set(k, requestId, 'EX', ttlSeconds);
    } else {
      await this.redis.set(k, requestId);
    }
  }

  // returns the requestId if the grant is active, null if expired
  async getGrant(userId: string, resource: string): Promise<string | null> {
    return this.redis.get(this.key(userId, resource));
  }

  async getGrantTtl(userId: string, resource: string): Promise<number> {
    return this.redis.ttl(this.key(userId, resource));
  }

  // delete the grant key on manual revoke
  async deleteGrantKey(userId: string, resource: string): Promise<void> {
    await this.redis.del(this.key(userId, resource));
  }

  // returns all the resources a user currently has active grants for
  async getUserActiveResources(userId: string): Promise<string[]> {
    const pattern = `grant:${userId}:*`;
    const keys = await this.scan(pattern);

    // Strip "grant:{userId}:" prefix
    const prefix = `grant:${userId}:`;
    return keys.map((k) => k.slice(prefix.length));
  }

  private async scan(pattern: string): Promise<string[]> {
    const results: string[] = [];
    let cursor = '0';

    // scan returns a cursor and a batch of keys each iteration
    // when redis returns cursor '0' the full scan is complete
    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH', pattern,
        'COUNT', 100,
      );

      cursor = nextCursor;
      results.push(...keys);

    } while (cursor !== '0');

    return results;
  }
}