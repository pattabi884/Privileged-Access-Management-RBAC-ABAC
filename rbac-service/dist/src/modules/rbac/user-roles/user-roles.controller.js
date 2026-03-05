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
exports.UserRolesController = void 0;
const common_1 = require("@nestjs/common");
const user_roles_service_1 = require("./user-roles.service");
const assign_role_dto_1 = require("./dto/assign-role.dto");
const require_permissions_decorator_1 = require("../../auth/decorators/require-permissions.decorator");
const public_decorator_1 = require("../../auth/decorators/public.decorator");
let UserRolesController = class UserRolesController {
    constructor(userRolesService) {
        this.userRolesService = userRolesService;
    }
    assignRole(dto) {
        return this.userRolesService.assignRole(dto.userId, dto.roleId, dto.assignedBy);
    }
    removeRole(userId, roleId) {
        return this.userRolesService.removeRole(userId, roleId);
    }
    getUserRoles(userId) {
        return this.userRolesService.getUserRoles(userId);
    }
    getUserPermissions(userId) {
        return this.userRolesService.getUserPermissions(userId);
    }
    getUsersWithRole(roleId) {
        return this.userRolesService.getUsersWithRole(roleId);
    }
};
exports.UserRolesController = UserRolesController;
__decorate([
    (0, common_1.Post)('assign'),
    (0, require_permissions_decorator_1.RequirePermissions)('roles:assign'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [assign_role_dto_1.AssignRoleDto]),
    __metadata("design:returntype", void 0)
], UserRolesController.prototype, "assignRole", null);
__decorate([
    (0, common_1.Delete)(':userId/:roleId'),
    (0, require_permissions_decorator_1.RequirePermissions)('roles:assign'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], UserRolesController.prototype, "removeRole", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('user/:userId/roles'),
    (0, require_permissions_decorator_1.RequirePermissions)('roles:read'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserRolesController.prototype, "getUserRoles", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('user/:userId/permissions'),
    (0, require_permissions_decorator_1.RequirePermissions)('roles:read'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserRolesController.prototype, "getUserPermissions", null);
__decorate([
    (0, common_1.Get)('role/:roleId/users'),
    (0, require_permissions_decorator_1.RequirePermissions)('roles:read'),
    __param(0, (0, common_1.Param)('roleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UserRolesController.prototype, "getUsersWithRole", null);
exports.UserRolesController = UserRolesController = __decorate([
    (0, common_1.Controller)('user-roles'),
    __metadata("design:paramtypes", [user_roles_service_1.UserRolesService])
], UserRolesController);
//# sourceMappingURL=user-roles.controller.js.map