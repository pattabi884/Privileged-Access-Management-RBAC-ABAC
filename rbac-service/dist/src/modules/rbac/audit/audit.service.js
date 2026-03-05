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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const mongoose_2 = require("mongoose");
const bullmq_2 = require("bullmq");
const audit_log_schema_1 = require("../../../infrastructure/database/schemas/audit-log.schema");
let AuditService = class AuditService {
    constructor(auditModel, auditQueue) {
        this.auditModel = auditModel;
        this.auditQueue = auditQueue;
    }
    async logPermissionCheck(log) {
        const isReadPermission = log.permission.endsWith(':read');
        if (log.granted && isReadPermission)
            return;
        await this.auditQueue.add('permission-check', log);
    }
    async storeAuditLog(log) {
        const raw = new Date(log.context.timestamp);
        const timestamp = new Date(Math.round(raw.getTime() / 1000) * 1000);
        const existing = await this.auditModel.findOne({
            userId: log.userId,
            permission: log.permission,
            granted: log.granted,
            timestamp: { $gte: new Date(timestamp.getTime() - 5000), $lte: new Date(timestamp.getTime() + 5000) },
        });
        if (existing) {
            return existing;
        }
        const doc = new this.auditModel({
            userId: log.userId,
            userEmail: log.context.userEmail,
            userDepartment: log.context.userDepartment,
            action: 'permission_check',
            permission: log.permission,
            granted: log.granted,
            reason: log.reason,
            evaluatedRules: log.evaluatedRules || [],
            ipAddress: log.context.ipAddress,
            userAgent: log.context.userAgent,
            timestamp: timestamp,
            resourceId: log.context.resourceId,
            resourceType: log.context.resourceType,
            hasMFA: log.context.hasMFA,
            sessionAge: log.context.sessionAge,
        });
        return doc.save();
    }
    async getUserAuditLogs(userId, limit = 50) {
        return this.auditModel.find({ userId }).sort({ timestamp: -1 }).limit(limit);
    }
    async getSuspiciousActivity(limit = 100) {
        return this.auditModel
            .find({ isSuspicious: true })
            .sort({ timestamp: -1 })
            .limit(limit);
    }
    async markAsSuspicious(logId, reason) {
        return this.auditModel.findByIdAndUpdate(logId, { isSuspicious: true, suspiciousReason: reason }, { returnDocument: 'after' });
    }
    async getRecentLogs(limit = 200) {
        return this.auditModel
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit);
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __param(1, (0, bullmq_1.InjectQueue)('audit')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        bullmq_2.Queue])
], AuditService);
//# sourceMappingURL=audit.service.js.map