import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';

import { QueueModule } from '@infrastructure/queues/queue.module';
import { RedisModule } from '@infrastructure/redis/redis.module';

import { RbacModule } from '@modules/rbac/rbac.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { BonusModule } from '@modules/bonus/bonus.module';
import { AccessRequestsModule } from '@modules/access-requests/access-request.module';
import { GrantsModule } from '@modules/grants/grants.module';

import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
      }),
    }),

    CacheModule.register({ isGlobal: true }),

    RedisModule,
    QueueModule,
    AuthModule,
    RbacModule,
    UsersModule,
    BonusModule,
    AccessRequestsModule,
    GrantsModule,
  ],

  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}