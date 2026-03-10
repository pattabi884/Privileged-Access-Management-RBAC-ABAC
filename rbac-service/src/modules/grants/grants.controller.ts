import { Controller, Get, Query, Param, Request, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AccessRequest,
  AccessRequestDocument,
  AccessRequestStatus,
} from '@infrastructure/database/schemas/access-request.schema';
import { GrantCacheService } from '@infrastructure/cache/grant-cache.service';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';

@Controller('grants')
export class GrantsController {
  constructor(
    @InjectModel(AccessRequest.name)
    private readonly accessRequestModel: Model<AccessRequestDocument>,
    private readonly grantCacheService: GrantCacheService,
  ) {}

  @Get('active')
  async getMyActive(@Request() req: any) {
    return this.buildActiveGrantsResponse(req.user.userId);
  }

  @Get('active/:userId')
  @RequirePermissions('access:read')
  async getActiveForUser(@Param('userId') userId: string) {
    return this.buildActiveGrantsResponse(userId);
  }

  @Get('check')
  @RequirePermissions('access:read')
  async checkAccess(
    @Query('userId') userId: string,
    @Query('resource') resource: string,
  ) {
    if (!userId || !resource) {
      throw new BadRequestException('userId and resource query params are required');
    }

    // Fast path — Redis
    const requestId = await this.grantCacheService.getGrant(userId, resource);
    if (requestId !== null) {
      const ttl     = await this.grantCacheService.getGrantTtl(userId, resource);
      const request = await this.accessRequestModel.findById(requestId).exec();
      return {
        granted:     true,
        requestId,
        resource,
        expiresAt:   request?.expiresAt ?? null,
        isPermanent: request?.isPermanent ?? false,
        ttlSeconds:  ttl === -1 ? null : ttl,
        source:      'redis',
      };
    }

    // Fallback — MongoDB (covers Redis-flush edge case)
    const dbGrant = await this.accessRequestModel.findOne({
      requesterId: userId,
      resource,
      status: AccessRequestStatus.APPROVED,
    }).exec();

    if (dbGrant) {
      const ttlSeconds = dbGrant.isPermanent
        ? 0
        : Math.max(0, Math.floor((dbGrant.expiresAt!.getTime() - Date.now()) / 1000));

      if (ttlSeconds > 0 || dbGrant.isPermanent) {
        await this.grantCacheService.setGrant(userId, resource, dbGrant._id.toString(), ttlSeconds);
      }

      return {
        granted:     true,
        requestId:   dbGrant._id.toString(),
        resource,
        expiresAt:   dbGrant.expiresAt,
        isPermanent: dbGrant.isPermanent,
        ttlSeconds:  dbGrant.isPermanent ? null : ttlSeconds,
        source:      'mongodb-fallback',
      };
    }

    return {
      granted:     false,
      requestId:   null,
      resource,
      expiresAt:   null,
      isPermanent: false,
      ttlSeconds:  null,
      source:      'redis',
    };
  }

  private async buildActiveGrantsResponse(userId: string) {
    const resources = await this.grantCacheService.getUserActiveResources(userId);

    const grants = await Promise.all(
      resources.map(async (resource) => {
        const requestId = await this.grantCacheService.getGrant(userId, resource);
        const ttl       = await this.grantCacheService.getGrantTtl(userId, resource);
        const request   = requestId
          ? await this.accessRequestModel.findById(requestId).exec()
          : null;

        return {
          resource,
          requestId,
          expiresAt:     request?.expiresAt ?? null,
          isPermanent:   request?.isPermanent ?? false,
          ttlSeconds:    ttl === -1 ? null : ttl,
          grantedBy:     request?.reviewerEmail ?? null,
          grantedAt:     request?.reviewedAt ?? null,
          justification: request?.justification ?? null,
        };
      }),
    );

    return grants;
  }
}