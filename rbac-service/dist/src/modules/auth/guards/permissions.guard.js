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
var PermissionsGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const audit_service_1 = require("../../rbac/audit/audit.service");
const context_evaluator_service_1 = require("../../rbac/context/context-evaluator.service");
const user_roles_service_1 = require("../../rbac/user-roles/user-roles.service");
const public_decorator_1 = require("../decorators/public.decorator");
const auth_utils_1 = require("../../../common/utils/auth.utils");
let PermissionsGuard = PermissionsGuard_1 = class PermissionsGuard {
    constructor(reflector, userRolesService, contextEvaluator, auditService) {
        this.reflector = reflector;
        this.userRolesService = userRolesService;
        this.contextEvaluator = contextEvaluator;
        this.auditService = auditService;
        this.logger = new common_1.Logger(PermissionsGuard_1.name);
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            this.logger.log('Route is public — skipping permission check');
            return true;
        }
        const requiredPermissions = this.reflector.get('permissions', context.getHandler());
        if (!requiredPermissions || requiredPermissions.length === 0) {
            this.logger.log('No permissions required for this route — allowing');
            return true;
        }
        this.logger.log(`Required permissions: ${requiredPermissions.join(', ')}`);
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            this.logger.warn('No user on request — JWT guard may have failed');
            return false;
        }
        this.logger.log(`Checking permissions for user: ${user.email} (${user.userId})`);
        const permissionContext = this.buildContext(request, user);
        for (const permission of requiredPermissions) {
            this.logger.log(`Checking basic permission: ${permission}`);
            const hasBasicPermission = await this.userRolesService.hasPermission(user.userId, permission);
            if (!hasBasicPermission) {
                this.logger.warn(`DENIED — User ${user.email} does not have permission: ${permission}`);
                await this.auditService.logPermissionCheck({
                    userId: user.userId,
                    permission,
                    granted: false,
                    reason: 'Permission not assigned to user',
                    context: permissionContext,
                });
                throw new common_1.ForbiddenException(`Missing required permission: ${permission}`);
            }
            this.logger.log(`Basic permission ${permission} — FOUND, checking context rules...`);
            const decision = this.contextEvaluator.evaluatePermission(permission, permissionContext);
            this.logger.log(`Context evaluation for ${permission}: ${decision.granted ? 'GRANTED' : 'DENIED'} — ${decision.reason}`);
            await this.auditService.logPermissionCheck({
                userId: user.userId,
                permission,
                granted: decision.granted,
                reason: decision.reason,
                evaluatedRules: decision.evaluatedRules,
                context: permissionContext,
            });
            if (!decision.granted) {
                this.logger.warn(`DENIED by context rule — ${decision.reason}`);
                throw new common_1.ForbiddenException(`Permission denied: ${decision.reason}`);
            }
            this.logger.log(`Permission ${permission} — GRANTED for ${user.email}`);
        }
        return true;
    }
    buildContext(request, user) {
        const resourceId = request.params?.id || request.body?.resourceId;
        const resourceType = this.extractResourceType(request.route?.path);
        this.logger.debug(`Building context — resource: ${resourceType}, id: ${resourceId}`);
        return {
            userId: user.userId,
            userEmail: user.email,
            userDepartment: user.department,
            userRole: user.role,
            resourceId,
            resourceType,
            resourceDepartment: request.body?.department,
            resourceOwnerId: request.body?.ownerId,
            ipAddress: (0, auth_utils_1.getClientIp)(request),
            userAgent: request.headers['user-agent'] || 'unknown',
            timestamp: new Date(),
            hasMFA: user.mfaVerified || false,
            sessionAge: (0, auth_utils_1.calculateSessionAge)(user.loginTime),
            deviceTrusted: this.isDeviceTrusted(request),
        };
    }
    extractResourceType(path) {
        if (!path)
            return 'unknown';
        const match = path.match(/\/api\/([^\/]+)/);
        return match ? match[1] : 'unknown';
    }
    isDeviceTrusted(request) {
        return !!request.headers['x-device-id'];
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = PermissionsGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        user_roles_service_1.UserRolesService,
        context_evaluator_service_1.ContextEvaluatorService,
        audit_service_1.AuditService])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map