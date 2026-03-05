import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  AccessRequest,
  AccessRequestDocument,
  AccessRequestStatus,
} from '@infrastructure/database/schemas/access-request.schema';

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
  ) {}

 // The requesterId and security context come from the caller (controller
  // extracts them from req.user and req), never from the request body.
  
  async create(
    dto: CreateAccessRequestDto,
    requester: { userId: string; email: string },
    context: { ip: string; userAgent: string },
  ): Promise<AccessRequestDocument> {
    const request = new this.accessRequestModel({
      requesterId:         requester.userId,
      requesterEmail:      requester.email,
      resource:            dto.resource,
      justification:       dto.justification,
      requestedDuration:   dto.requestedDuration,
      status:              AccessRequestStatus.PENDING,
      requesterIp:         context.ip,
      requesterUserAgent:  context.userAgent,
    });

    return request.save();
  }

 
  async findAll(status?: AccessRequestStatus): Promise<AccessRequestDocument[]> {
    const filter = status ? { status } : {};
    return this.accessRequestModel
      .find(filter)
      .sort({ createdAt: -1 }) // newest first — approvers work the queue top-down
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

  // ── Approve a pending request 
  //business rules enforced here:
  // 1. Status must be PENDING.
  // 2. Reviewer cannot be the requester.

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
      throw new ForbiddenException(
        'You cannot approve your own access request',
      );
    }

    request.status       = AccessRequestStatus.APPROVED;
    request.reviewerId   = reviewer.userId;
    request.reviewerEmail = reviewer.email;
    request.reviewNote   = dto.reviewNote ?? null;
    request.reviewedAt   = new Date();

    return request.save();
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
      throw new ForbiddenException(
        'You cannot reject your own access request',
      );
    }

    // because the DTO marks it optional (it's optional for approve, required for reject).
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

    return request.save();
  }
}