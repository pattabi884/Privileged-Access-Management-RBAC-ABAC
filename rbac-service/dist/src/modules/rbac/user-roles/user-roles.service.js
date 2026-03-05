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
exports.UserRolesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_role_schema_1 = require("../../../infrastructure/database/schemas/user-role.schema");
const role_schema_1 = require("../../../infrastructure/database/schemas/role.schema");
const rbac_cache_service_1 = require("../../../infrastructure/cache/rbac-cache.service");
let UserRolesService = class UserRolesService {
    constructor(userRoleModel, roleModel, rbacCacheService) {
        this.userRoleModel = userRoleModel;
        this.roleModel = roleModel;
        this.rbacCacheService = rbacCacheService;
    }
    async assignRole(userId, roleId, assignedBy) {
        const role = await this.roleModel.findById(roleId);
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID '${roleId}' not found`);
        }
        const existing = await this.userRoleModel.findOne({ userId, roleId });
        if (existing) {
            return existing;
        }
        const userRole = new this.userRoleModel({
            userId,
            roleId,
            assignedAt: new Date(),
            assignedBy,
        });
        const saved = await userRole.save();
        await this.rbacCacheService.invalidateUserCache(userId);
        await this.rbacCacheService.addUserToRoleIndex(roleId, userId);
        return saved;
    }
    async removeRole(userId, roleId) {
        const result = await this.userRoleModel.deleteOne({ userId, roleId });
        if (result.deletedCount === 0) {
            throw new common_1.NotFoundException(`Role '${roleId}' not found for user '${userId}'`);
        }
        await this.rbacCacheService.invalidateUserCache(userId);
        await this.rbacCacheService.removeUserFromRoleIndex(roleId, userId);
    }
    async getUserRoles(userId) {
        const userRoles = await this.userRoleModel
            .find({ userId: userId.toString() })
            .populate('roleId')
            .exec();
        return userRoles.map((ur) => ur.roleId).filter(Boolean);
    }
    async getUserPermissions(userId) {
        const cached = await this.rbacCacheService.getUserPermissions(userId);
        if (cached !== null) {
            return cached;
        }
        const roles = await this.getUserRoles(userId);
        const permissions = new Set();
        for (const role of roles) {
            if (role && role.permissions) {
                role.permissions.forEach(p => permissions.add(p));
            }
        }
        const permissionsArray = Array.from(permissions);
        await this.rbacCacheService.setUserPermissions(userId, permissionsArray);
        return permissionsArray;
    }
    async hasPermission(userId, requiredPermission) {
        const permissions = await this.getUserPermissions(userId);
        if (permissions.includes(requiredPermission)) {
            return true;
        }
        const [resource] = requiredPermission.split(':');
        if (permissions.includes(`${resource}:*`)) {
            return true;
        }
        if (permissions.includes('*:*')) {
            return true;
        }
        return false;
    }
    async getUsersWithRole(roleId) {
        const userRoles = await this.userRoleModel.find({ roleId }).exec();
        return userRoles.map((ur) => ur.userId.toString());
    }
};
exports.UserRolesService = UserRolesService;
exports.UserRolesService = UserRolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_role_schema_1.UserRole.name)),
    __param(1, (0, mongoose_1.InjectModel)(role_schema_1.Role.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        rbac_cache_service_1.RbacCacheService])
], UserRolesService);
//# sourceMappingURL=user-roles.service.js.map