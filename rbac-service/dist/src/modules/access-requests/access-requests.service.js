"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessRequestService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const access_request_schema_1 = require("../../infrastructure/database/schemas/access-request.schema");
let AccessRequestService = class AccessRequestService {
    constructor(accessRequestModel) {
        this.accessRequestModel = accessRequestModel;
    }
    async create(dto, requester, context) {
        const request = new this.accessRequestModel({
            requesterId: requester.userId,
            requesterEmail: requester.email,
            resource: dto.resource,
            justification: dto.justification,
            requestedDuration: dto.requestedDuration,
            status: access_request_schema_1.AccessRequestStatus.PENDING,
            requesterIp: context.ip,
            requesterUserAgent: context.userAgent,
        });
        return request.save();
    }
    async findAll(status) {
        const filter = status ? { status } : {};
        return this.accessRequestModel
            .find(filter)
            .sort({ createdAt: -1 })
            .exec();
    }
    async findMine(userId) {
        return this.accessRequestModel
            .find({ requesterId: userId })
            .sort({ createdAt: -1 })
            .exec();
    }
    async findOne(id) {
        const request = await this.accessRequestModel.findById(id).exec();
        if (!request) {
            throw new common_1.NotFoundException(`Access request ${id} not found`);
        }
        return request;
    }
    async approve(requestId, reviewer, dto) {
        const request = await this.findOne(requestId);
        if (request.status !== access_request_schema_1.AccessRequestStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot approve a request with status '${request.status}'. Only pending requests can be approved.`);
        }
        if (request.requesterId === reviewer.userId) {
            throw new common_1.ForbiddenException('You cannot approve your own access request');
        }
        request.status = access_request_schema_1.AccessRequestStatus.APPROVED;
        request.reviewerId = reviewer.userId;
        request.reviewerEmail = reviewer.email;
        request.reviewNote = dto.reviewNote ?? null;
        request.reviewedAt = new Date();
        return request.save();
    }
    async reject(requestId, reviewer, dto) {
        const request = await this.findOne(requestId);
        if (request.status !== access_request_schema_1.AccessRequestStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot reject a request with status '${request.status}'. Only pending requests can be rejected.`);
        }
        if (request.requesterId === reviewer.userId) {
            throw new common_1.ForbiddenException('You cannot reject your own access request');
        }
        if (!dto.reviewNote?.trim()) {
            throw new common_1.BadRequestException('A review note explaining the rejection reason is required');
        }
        request.status = access_request_schema_1.AccessRequestStatus.REJECTED;
        request.reviewerId = reviewer.userId;
        request.reviewerEmail = reviewer.email;
        request.reviewNote = dto.reviewNote;
        request.reviewedAt = new Date();
        return request.save();
    }
    async revoke(requestId, reviewer, dto) {
        const request = await this.findOne(requestId);
        if (request.status !== access_request_schema_1.AccessRequestStatus.APPROVED) {
            throw new common_1.BadRequestException(`Cannot revoke a request with status '${request.status}'. Only approved requests can be revoked.`);
        }
        if (!dto.reviewNote?.trim()) {
            throw new common_1.BadRequestException('A review note explaining the revocation reason is required');
        }
        request.status = access_request_schema_1.AccessRequestStatus.REVOKED;
        request.reviewerId = reviewer.userId;
        request.reviewerEmail = reviewer.email;
        request.reviewNote = dto.reviewNote;
        request.reviewedAt = new Date();
        return request.save();
    }
};
exports.AccessRequestService = AccessRequestService;
exports.AccessRequestService = AccessRequestService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(access_request_schema_1.AccessRequest.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AccessRequestService);
//# sourceMappingURL=access-requests.service.js.map