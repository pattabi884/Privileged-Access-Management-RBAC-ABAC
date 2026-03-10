import { Module } from '@nestjs/common';
import { RbacCacheService } from './rbac-cache.service';
import { GrantCacheService } from './grant-cache.service';

@Module({
  providers: [RbacCacheService, GrantCacheService],
  exports: [RbacCacheService, GrantCacheService],
})
export class RbacCacheModule {}