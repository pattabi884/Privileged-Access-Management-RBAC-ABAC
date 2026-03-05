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
exports.AccessRequestsController = void 0;
const common_1 = require("@nestjs/common");
const access_requests_service_1 = require("./access-requests.service");
const require_permissions_decorator_1 = require("../auth/decorators/require-permissions.decorator");
const access_request_schema_1 = require("../../infrastructure/database/schemas/access-request.schema");
const auth_utils_1 = require("../../common/utils/auth.utils");
let AccessRequestsController = class AccessRequestsController {
    constructor(accessRequestService) {
        this.accessRequestService = accessRequestService;
    }
    create(body, req) {
        return this.accessRequestService.create(body, { userId: req.user.userId, email: req.user.email }, { ip: (0, auth_utils_1.getClientIp)(req), userAgent: req.headers['user-agent'] ?? 'unknown' });
    }
    findAll(status) {
        return this.accessRequestService.findAll(status);
    }
    findMine(req) {
        return this.accessRequestService.findMine(req.user.userId);
    }
    findOne(id) {
        return this.accessRequestService.findOne(id);
    }
    approve(id, body, req) {
        return this.accessRequestService.approve(id, { userId: req.user.userId, email: req.user.email }, body);
    }
    reject(id, body, req) {
        return this.accessRequestService.reject(id, { userId: req.user.userId, email: req.user.email }, body);
    }
    revoke(id, body, req) {
        return this.accessRequestService.revoke(id, { userId: req.user.userId, email: req.user.email }, body);
    }
};
exports.AccessRequestsController = AccessRequestsController;
__decorate([
    (0, common_1.Post)(),
    (0, require_permissions_decorator_1.RequirePermissions)('access:request'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AccessRequestsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permissions_decorator_1.RequirePermissions)('access:read'),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccessRequestsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('mine'),
    (0, require_permissions_decorator_1.RequirePermissions)('access:request'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AccessRequestsController.prototype, "findMine", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permissions_decorator_1.RequirePermissions)('access:read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AccessRequestsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, require_permissions_decorator_1.RequirePermissions)('access:approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AccessRequestsController.prototype, "approve", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, require_permissions_decorator_1.RequirePermissions)('access:approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AccessRequestsController.prototype, "reject", null);
__decorate([
    (0, common_1.Patch)(':id/revoke'),
    (0, require_permissions_decorator_1.RequirePermissions)('access:revoke'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AccessRequestsController.prototype, "revoke", null);
exports.AccessRequestsController = AccessRequestsController = __decorate([
    (0, common_1.Controller)('access-requests'),
    __metadata("design:paramtypes", [access_requests_service_1.AccessRequestService])
], AccessRequestsController);
//# sourceMappingURL=access-request.controller.js.map