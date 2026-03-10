import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AccessRequest,
  AccessRequestSchema,
} from '@infrastructure/database/schemas/access-request.schema';
import { RbacCacheModule } from '@infrastructure/cache/rbac-cache.module';
import { GrantsController } from './grants.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AccessRequest.name, schema: AccessRequestSchema },
    ]),
    RbacCacheModule,
  ],
  controllers: [GrantsController],
})
export class GrantsModule {}