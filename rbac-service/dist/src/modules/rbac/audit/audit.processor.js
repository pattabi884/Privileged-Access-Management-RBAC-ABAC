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
var AuditProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const audit_service_1 = require("./audit.service");
const suspicious_activity_service_1 = require("./suspicious-activity.service");
let AuditProcessor = AuditProcessor_1 = class AuditProcessor extends bullmq_1.WorkerHost {
    constructor(auditService, suspiciousService) {
        super();
        this.auditService = auditService;
        this.suspiciousService = suspiciousService;
        this.logger = new common_1.Logger(AuditProcessor_1.name);
    }
    async process(job) {
        try {
            const auditLog = await this.auditService.storeAuditLog(job.data);
            const suspicious = await this.suspiciousService.analyze(job.data.userId, job.data);
            if (suspicious.detected) {
                await this.auditService.markAsSuspicious(auditLog._id.toString(), suspicious.reason ?? 'No reason provided');
                this.logger.warn(`Suspicious activity detected`);
            }
        }
        catch (err) {
            this.logger.error(err.message);
            throw err;
        }
    }
};
exports.AuditProcessor = AuditProcessor;
exports.AuditProcessor = AuditProcessor = AuditProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('audit'),
    __metadata("design:paramtypes", [audit_service_1.AuditService,
        suspicious_activity_service_1.SuspiciousActivityService])
], AuditProcessor);
//# sourceMappingURL=audit.processor.js.map