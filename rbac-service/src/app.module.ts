// src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD } from '@nestjs/core';

// Infrastructure
import { QueueModule } from '@infrastructure/queues/queue.module';

import { RbacModule } from '@modules/rbac/rbac.module';
import { AuthModule } from '@modules/auth/auth.module';
import { UsersModule } from '@modules/users/users.module';
import { BonusModule } from '@modules/bonus/bonus.module'; // NEW

// Global guards
import { PermissionsGuard } from '@modules/auth/guards/permissions.guard';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { AccessRequestsModule } from '@modules/access-requests/access-request.module';



@Module({
  imports: [
    // Makes ConfigService available everywhere — reads .env files
    ConfigModule.forRoot({ isGlobal: true }),

    // MongoDB connection — URI comes from .env via ConfigService
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
      }),
    }),

    // Redis cache — isGlobal: true means RbacCacheService can inject
    // CACHE_MANAGER anywhere without re-importing CacheModule each time.
    CacheModule.register({ isGlobal: true }),

    // BullMQ queues (audit queue) — connects to Redis
    QueueModule,

    // JWT validation + Passport + AuthController (/auth/login, /auth/me, etc.)
    AuthModule,

    // Roles, permissions, user-roles, audit, context evaluator
    RbacModule,

    // User management (CRUD for user accounts)
    UsersModule,

    // NEW: Bonus approval endpoint — requires 'bonus:approve' permission
    // The global guards protect it automatically.
    BonusModule,
    AccessRequestsModule,
  ],

  providers: [
    // Guard 1: validates JWT, populates req.user
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Guard 2: checks permissions from req.user against @RequirePermissions() metadata
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}