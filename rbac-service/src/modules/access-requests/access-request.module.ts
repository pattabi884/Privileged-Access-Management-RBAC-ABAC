import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AccessRequestsController } from './access-request.controller';
import { AccessRequestService } from './access-requests.service';
import { GrantExpiryProcessor } from './grant-expiry.processor';
import {
  AccessRequest,
  AccessRequestSchema,
} from '@infrastructure/database/schemas/access-request.schema';
import { RbacCacheModule } from '@infrastructure/cache/rbac-cache.module';
import { RbacModule } from '@modules/rbac/rbac.module';

@Module({
  imports: [
    // AccessRequest model — needed by both AccessRequestService
    // and GrantExpiryProcessor to read and write request documents
    MongooseModule.forFeature([
      { name: AccessRequest.name, schema: AccessRequestSchema },
    ]),

    // Registers the grants queue injectable token in this module's scope.
    // AccessRequestService injects this to schedule delayed expiry jobs.
    // Required even though queue.module.ts registered it globally —
    // @InjectQueue() needs the token available in the local module context.
    BullModule.registerQueue({ name: 'grants' }),

    // Provides GrantCacheService — used by AccessRequestService (write grant
    // to Redis on approve) and GrantExpiryProcessor (delete key on expiry)
    RbacCacheModule,

    // Provides AuditService — used by GrantExpiryProcessor to write the
    // auto-expiry audit log entry
    RbacModule,
  ],
  controllers: [AccessRequestsController],
  providers: [
    AccessRequestService,

    // Declaring the processor as a provider is what registers it as a
    // BullMQ worker. Without this line, jobs queued to 'grants' would
    // sit in Redis indefinitely with no consumer to process them.
    GrantExpiryProcessor,
  ],
})
export class AccessRequestsModule {}