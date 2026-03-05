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
exports.AuditController = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("./audit.service");
const require_permissions_decorator_1 = require("../../auth/decorators/require-permissions.decorator");
let AuditController = class AuditController {
    constructor(auditService) {
        this.auditService = auditService;
    }
    getRecent(limit) {
        return this.auditService.getRecentLogs(limit);
    }
    getSuspicious(limit) {
        return this.auditService.getSuspiciousActivity(limit);
    }
    getUserLogs(userId, limit) {
        return this.auditService.getUserAuditLogs(userId, limit);
    }
};
exports.AuditController = AuditController;
__decorate([
    (0, common_1.Get)('recent'),
    (0, require_permissions_decorator_1.RequirePermissions)('audit:read'),
    __param(0, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(200), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getRecent", null);
__decorate([
    (0, common_1.Get)('suspicious'),
    (0, require_permissions_decorator_1.RequirePermissions)('audit:read'),
    __param(0, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(100), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getSuspicious", null);
__decorate([
    (0, common_1.Get)('user/:userId'),
    (0, require_permissions_decorator_1.RequirePermissions)('audit:read'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", void 0)
], AuditController.prototype, "getUserLogs", null);
exports.AuditController = AuditController = __decorate([
    (0, common_1.Controller)('audit'),
    __metadata("design:paramtypes", [audit_service_1.AuditService])
], AuditController);
//# sourceMappingURL=audit.controller.js.map