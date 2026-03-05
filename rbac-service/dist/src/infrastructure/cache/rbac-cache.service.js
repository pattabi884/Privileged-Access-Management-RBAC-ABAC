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
exports.RbacCacheService = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
let RbacCacheService = class RbacCacheService {
    constructor(cacheManager) {
        this.cacheManager = cacheManager;
        this.TTL = 300;
    }
    async getUserPermissions(userId) {
        const key = `user:${userId}:permissions`;
        return (await this.cacheManager.get(key)) ?? null;
    }
    async setUserPermissions(userId, permissions) {
        const key = `user:${userId}:permissions`;
        await this.cacheManager.set(key, permissions, this.TTL);
    }
    async invalidateUserCache(userId) {
        const key = `user:${userId}:permissions`;
        await this.cacheManager.del(key);
    }
    async getRoleUsers(roleId) {
        const key = `role:${roleId}:users`;
        return (await this.cacheManager.get(key)) ?? [];
    }
    async addUserToRoleIndex(roleId, userId) {
        const key = `role:${roleId}:users`;
        const existing = await this.getRoleUsers(roleId);
        if (!existing.includes(userId)) {
            existing.push(userId);
            await this.cacheManager.set(key, existing, 0);
        }
    }
    async removeUserFromRoleIndex(roleId, userId) {
        const key = `role:${roleId}:users`;
        const existing = await this.getRoleUsers(roleId);
        const updated = existing.filter((id) => id !== userId);
        await this.cacheManager.set(key, updated, 0);
    }
    async invalidateRoleCache(roleId) {
        const usersWithRole = await this.getRoleUsers(roleId);
        if (usersWithRole.length === 0) {
            return;
        }
        await Promise.all(usersWithRole.map((userId) => this.invalidateUserCache(userId)));
    }
};
exports.RbacCacheService = RbacCacheService;
exports.RbacCacheService = RbacCacheService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cache_manager_1.CACHE_MANAGER)),
    __metadata("design:paramtypes", [Object])
], RbacCacheService);
//# sourceMappingURL=rbac-cache.service.js.map