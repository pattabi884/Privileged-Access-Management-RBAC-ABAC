import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

// String token — import this wherever you need to @Inject() the Redis client.
// Defined here so there's one source of truth for the string value.
export const REDIS_CLIENT = 'REDIS_CLIENT';

// @Global() means AppModule imports this once and REDIS_CLIENT is available
// everywhere — no need to import RedisModule in every feature module.
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const redisUrl = config.get<string>('REDIS_URL');

        if (redisUrl) {
          // rediss:// (double-s) = TLS required — Upstash always uses this.
          // Passing the full URL to ioredis works because ioredis parses it
          // the same way new URL() does — host, port, password all extracted.
          return new Redis(redisUrl, {
            tls: redisUrl.startsWith('rediss://') ? {} : undefined,
            maxRetriesPerRequest: 3,
            // lazyConnect: false means the connection is established at
            // startup, not on first command. Startup failures are easier
            // to diagnose than silent failures on the first Redis call.
            lazyConnect: false,
          });
        }

        // Local development fallback — no auth, no TLS
        return new Redis({ host: 'localhost', port: 6379 });
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}