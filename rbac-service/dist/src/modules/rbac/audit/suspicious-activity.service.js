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
exports.SuspiciousActivityService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const audit_log_schema_1 = require("../../../infrastructure/database/schemas/audit-log.schema");
const mongoose_2 = require("mongoose");
let SuspiciousActivityService = class SuspiciousActivityService {
    constructor(auditModel) {
        this.auditModel = auditModel;
    }
    async analyze(userId, log) {
        const checks = await Promise.all([
            this.checkRapidDenials(userId, log),
            this.checkOffHours(log),
        ]);
        return checks.find(c => c.detected) || { detected: false };
    }
    async checkRapidDenials(userId, log) {
        if (log.granted)
            return { detected: false };
        const oneHourAgo = new Date(Date.now() - 3600000);
        const count = await this.auditModel.countDocuments({
            userId,
            granted: false,
            timestamp: { $gte: oneHourAgo },
        });
        if (count >= 5) {
            return {
                detected: true,
                reason: `${count} access denials recorded within the last 60 minutes — possible privilege escalation or misconfigured account`,
            };
        }
        return { detected: false };
    }
    async checkOffHours(log) {
        const hour = new Date(log.context.timestamp).getHours();
        if (hour < 8 || hour >= 20) {
            if (log.permission.includes('delete')) {
                return {
                    detected: true,
                    reason: `Destructive operation attempted outside business hours (${hour}:00)`,
                };
            }
        }
        return { detected: false };
    }
};
exports.SuspiciousActivityService = SuspiciousActivityService;
exports.SuspiciousActivityService = SuspiciousActivityService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SuspiciousActivityService);
//# sourceMappingURL=suspicious-activity.service.js.map