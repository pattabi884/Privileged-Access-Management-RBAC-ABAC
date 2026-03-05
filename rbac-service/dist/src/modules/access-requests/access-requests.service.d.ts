import { Model } from 'mongoose';
import { AccessRequestDocument, AccessRequestStatus } from '@infrastructure/database/schemas/access-request.schema';
export interface CreateAccessRequestDto {
    resource: string;
    justification: string;
    requestedDuration: string;
}
export interface ReviewAccessRequestDto {
    reviewNote?: string;
}
export declare class AccessRequestService {
    private accessRequestModel;
    constructor(accessRequestModel: Model<AccessRequestDocument>);
    create(dto: CreateAccessRequestDto, requester: {
        userId: string;
        email: string;
    }, context: {
        ip: string;
        userAgent: string;
    }): Promise<AccessRequestDocument>;
    findAll(status?: AccessRequestStatus): Promise<AccessRequestDocument[]>;
    findMine(userId: string): Promise<AccessRequestDocument[]>;
    findOne(id: string): Promise<AccessRequestDocument>;
    approve(requestId: string, reviewer: {
        userId: string;
        email: string;
    }, dto: ReviewAccessRequestDto): Promise<AccessRequestDocument>;
    reject(requestId: string, reviewer: {
        userId: string;
        email: string;
    }, dto: ReviewAccessRequestDto): Promise<AccessRequestDocument>;
    revoke(requestId: string, reviewer: {
        userId: string;
        email: string;
    }, dto: ReviewAccessRequestDto): Promise<AccessRequestDocument>;
}
