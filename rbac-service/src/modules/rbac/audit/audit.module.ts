// src/modules/rbac/audit/audit.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { AuditLog, AuditLogSchema } from '@infrastructure/database/schemas/audit-log.schema';
import { AuditService } from './audit.service';
import { AuditProcessor } from './audit.processor';
import { SuspiciousActivityService } from './suspicious-activity.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
    BullModule.registerQueue({ name: 'audit' }),
  ],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditProcessor,
    SuspiciousActivityService,
  ],
  exports: [AuditService],
})
export class AuditModule {}