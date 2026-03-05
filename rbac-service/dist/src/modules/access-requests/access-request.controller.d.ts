import { AccessRequestService, CreateAccessRequestDto, ReviewAccessRequestDto } from './access-requests.service';
import { AccessRequestStatus } from '@infrastructure/database/schemas/access-request.schema';
export declare class AccessRequestsController {
    private readonly accessRequestService;
    constructor(accessRequestService: AccessRequestService);
    create(body: CreateAccessRequestDto, req: any): Promise<import("@infrastructure/database/schemas/access-request.schema").AccessRequestDocument>;
    findAll(status?: AccessRequestStatus): Promise<import("@infrastructure/database/schemas/access-request.schema").AccessRequestDocument[]>;
    findMine(req: any): Promise<import("@infrastructure/database/schemas/access-request.schema").AccessRequestDocument[]>;
    findOne(id: string): Promise<import("@infrastructure/database/schemas/access-request.schema").AccessRequestDocument>;
    approve(id: string, body: ReviewAccessRequestDto, req: any): Promise<import("@infrastructure/database/schemas/access-request.schema").AccessRequestDocument>;
    reject(id: string, body: ReviewAccessRequestDto, req: any): Promise<import("@infrastructure/database/schemas/access-request.schema").AccessRequestDocument>;
    revoke(id: string, body: ReviewAccessRequestDto, req: any): Promise<import("@infrastructure/database/schemas/access-request.schema").AccessRequestDocument>;
}
