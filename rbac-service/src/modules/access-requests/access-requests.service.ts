import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import {
  AccessRequest,
  AccessRequestDocument,
  AccessRequestStatus,
} from '@infrastructure/database/schemas/access-request.schema';
import { GrantCacheService } from '@infrastructure/cache/grant-cache.service';
import { parseDuration } from '@common/utils/duration.utils';
import { GrantExpiryJobData } from './grant-expiry.processor';
//import { GrantExpiryJobData } from './grant-expiry.processor';

export interface CreateAccessRequestDto {
  resource: string;
  justification: string;
  requestedDuration: string;
}

export interface ReviewAccessRequestDto {
  reviewNote?: string;
}

@Injectable()
export class AccessRequestService {
  constructor(
    @InjectModel(AccessRequest.name)
    private accessRequestModel: Model<AccessRequestDocument>,

    // Raw Redis grant keys — fast-path access verification
    private readonly grantCacheService: GrantCacheService,

    // Grants queue — delayed jobs that fire when a grant's TTL elapses
    // and write EXPIRED back to MongoDB
    @InjectQueue('grants')
    private readonly grantsQueue: Queue,
  ) {}

  async create(
    dto: CreateAccessRequestDto,
    requester: { userId: string; email: string },
    context: { ip: string; userAgent: string },
  ): Promise<AccessRequestDocument> {
    const request = new this.accessRequestModel({
      requesterId:        requester.userId,
      requesterEmail:     requester.email,
      resource:           dto.resource,
      justification:      dto.justification,
      requestedDuration:  dto.requestedDuration,
      status:             AccessRequestStatus.PENDING,
      requesterIp:        context.ip,
      requesterUserAgent: context.userAgent,
    });

    return request.save();
  }

  async findAll(status?: AccessRequestStatus): Promise<AccessRequestDocument[]> {
    const filter = status ? { status } : {};
    return this.accessRequestModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findMine(userId: string): Promise<AccessRequestDocument[]> {
    return this.accessRequestModel
      .find({ requesterId: userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<AccessRequestDocument> {
    const request = await this.accessRequestModel.findById(id).exec();
    if (!request) {
      throw new NotFoundException(`Access request ${id} not found`);
    }
    return request;
  }

  async approve(
    requestId: string,
    reviewer: { userId: string; email: string },
    dto: ReviewAccessRequestDto,
  ): Promise<AccessRequestDocument> {
    const request = await this.findOne(requestId);

    if (request.status !== AccessRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve a request with status '${request.status}'. Only pending requests can be approved.`,
      );
    }

    if (request.requesterId === reviewer.userId) {
      throw new ForbiddenException('You cannot approve your own access request');
    }

    // ── Step 1: Parse duration ─────────────────────────────────────────────
    //
    // requestedDuration is the raw string the employee submitted.
    // parseDuration gives us ms (null if permanent) and a clean label
    // for audit log messages.
    const { ms, isPermanent, label } = parseDuration(request.requestedDuration);

    // expiresAt is the absolute timestamp — what gets stored on the document
    // and displayed in the frontend. null for permanent grants.
    const expiresAt = isPermanent ? null : new Date(Date.now() + ms!);

    // ── Step 2: Write to MongoDB ───────────────────────────────────────────
    //
    // MongoDB is written first — it's the source of truth.
    // If the Redis write or BullMQ job scheduling fails after this,
    // the grants.controller.ts fallback path re-hydrates Redis from MongoDB.
    request.status        = AccessRequestStatus.APPROVED;
    request.reviewerId    = reviewer.userId;
    request.reviewerEmail = reviewer.email;
    request.reviewNote    = dto.reviewNote ?? null;
    request.reviewedAt    = new Date();
    request.expiresAt     = expiresAt;
    request.isPermanent   = isPermanent;

    const saved = await request.save();

    // ── Step 3: Write to Redis ─────────────────────────────────────────────
    //
    // ttlSeconds = 0 signals permanent to setGrant() — no EX flag is set.
    // For finite grants, Math.floor(ms / 1000) converts ms to whole seconds.
    const ttlSeconds = isPermanent ? 0 : Math.floor(ms! / 1000);

    await this.grantCacheService.setGrant(
      request.requesterId,     // carol_id
      request.resource,        // 'demo-access'
      saved._id.toString(),    // MongoDB _id as the value — pointer back to doc
      ttlSeconds,              // 120 for a 2-minute grant
    );

    // ── Step 4: Schedule expiry job ────────────────────────────────────────
    //
    // Only for finite grants — permanent grants have no expiry job.
    // The delay option tells BullMQ to hold this job for ms milliseconds
    // before making it available to the processor. The job survives
    // server restarts because BullMQ stores it in Redis as a sorted set
    // scored by the target fire timestamp.
    if (!isPermanent && ms !== null) {
      const jobData: GrantExpiryJobData = { requestId: saved._id.toString() };
      await this.grantsQueue.add('expire-grant', jobData, { delay: ms });
    }

    return saved;
  }

  async reject(
    requestId: string,
    reviewer: { userId: string; email: string },
    dto: ReviewAccessRequestDto,
  ): Promise<AccessRequestDocument> {
    const request = await this.findOne(requestId);

    if (request.status !== AccessRequestStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject a request with status '${request.status}'. Only pending requests can be rejected.`,
      );
    }

    if (request.requesterId === reviewer.userId) {
      throw new ForbiddenException('You cannot reject your own access request');
    }

    if (!dto.reviewNote?.trim()) {
      throw new BadRequestException(
        'A review note explaining the rejection reason is required',
      );
    }

    request.status        = AccessRequestStatus.REJECTED;
    request.reviewerId    = reviewer.userId;
    request.reviewerEmail = reviewer.email;
    request.reviewNote    = dto.reviewNote;
    request.reviewedAt    = new Date();

    return request.save();
  }

  async revoke(
    requestId: string,
    reviewer: { userId: string; email: string },
    dto: ReviewAccessRequestDto,
  ): Promise<AccessRequestDocument> {
    const request = await this.findOne(requestId);

    if (request.status !== AccessRequestStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot revoke a request with status '${request.status}'. Only approved requests can be revoked.`,
      );
    }

    if (!dto.reviewNote?.trim()) {
      throw new BadRequestException(
        'A review note explaining the revocation reason is required',
      );
    }

    request.status        = AccessRequestStatus.REVOKED;
    request.reviewerId    = reviewer.userId;
    request.reviewerEmail = reviewer.email;
    request.reviewNote    = dto.reviewNote;
    request.reviewedAt    = new Date();

    const saved = await request.save();

    // ── Delete Redis grant key immediately ─────────────────────────────────
    //
    // Without this, the Redis key lives until its natural TTL expires.
    // During that window GET /grants/check would still return granted: true
    // even though the document says REVOKED. That's an access control gap.
    // Manual revoke must clear Redis immediately — don't wait for TTL.
    await this.grantCacheService.deleteGrantKey(
      request.requesterId,
      request.resource,
    );

    return saved;
  }
}