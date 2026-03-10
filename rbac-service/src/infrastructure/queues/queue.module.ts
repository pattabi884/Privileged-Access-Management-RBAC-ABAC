import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');

        if (redisUrl) {
          const url = new URL(redisUrl);
          return {
            connection: {
              host: url.hostname,
              port: parseInt(url.port),
              password: url.password,
              tls: redisUrl.startsWith('rediss://') ? {} : undefined,
            },
          };
        }

        return { connection: { host: 'localhost', port: 6379 } };
      },
    }),

    // Existing queue — audit processor consumes from this
    BullModule.registerQueue({ name: 'audit' }),

    // New queue — grant-expiry processor consumes from this.
    // Jobs are pushed here by access-requests.service.ts approve()
    // with a delay equal to the grant duration in milliseconds.
    // BullMQ persists delayed jobs in Redis so a server restart
    // doesn't lose pending expiry jobs.
    BullModule.registerQueue({ name: 'grants' }),
  ],
  exports: [BullModule],
})
export class QueueModule {}