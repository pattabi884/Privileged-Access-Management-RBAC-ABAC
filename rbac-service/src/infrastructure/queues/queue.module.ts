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
            // Slow down polling — free Upstash tier burns through
            // 500k requests fast with default aggressive polling.
            // stalledInterval: how often BullMQ checks for stalled jobs (ms)
            // maxStalledCount: retries before marking a job as failed
            defaultJobOptions: {
              removeOnComplete: 100,  // keep only last 100 completed jobs
              removeOnFail: 100,
            },
          };
        }

        return { connection: { host: 'localhost', port: 6379 } };
      },
    }),

    BullModule.registerQueue({
      name: 'audit',
      defaultJobOptions: { removeOnComplete: 50, removeOnFail: 50 },
    }),
    BullModule.registerQueue({
      name: 'grants',
      defaultJobOptions: { removeOnComplete: 50, removeOnFail: 50 },
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}