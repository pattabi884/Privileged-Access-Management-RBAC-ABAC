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
exports.PermissionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const permission_schema_1 = require("../../../infrastructure/database/schemas/permission.schema");
let PermissionsService = class PermissionsService {
    constructor(permissionModel) {
        this.permissionModel = permissionModel;
    }
    async create(dto) {
        const existing = await this.permissionModel.findOne({ name: dto.name });
        if (existing) {
            throw new common_1.ConflictException(`Permission ${dto.name} already exists`);
        }
        const permission = new this.permissionModel(dto);
        return permission.save();
    }
    async findAll() {
        return this.permissionModel.find().sort({ resource: 1, action: 1 });
    }
    async findOne(id) {
        const permission = await this.permissionModel.findById(id);
        if (!permission) {
            throw new common_1.NotFoundException(`Permission ${id} not found`);
        }
        return permission;
    }
    async findByResource(resource) {
        return this.permissionModel
            .find({ resource, isActive: true })
            .sort({ action: 1 });
    }
    async update(id, dto) {
        const permission = await this.permissionModel.findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after' });
        if (!permission) {
            throw new common_1.NotFoundException(`Permission ${id} not found`);
        }
        return permission;
    }
    async deactivate(id) {
        const permission = await this.permissionModel.findByIdAndUpdate(id, { isActive: false }, { returnDocument: 'after' });
        if (!permission) {
            throw new common_1.NotFoundException(`Permission ${id} not found`);
        }
        return permission;
    }
    async validatePermissions(names) {
        const found = await this.permissionModel.countDocuments({
            name: { $in: names },
            isActive: true,
        });
        return found === names.length;
    }
    async seedPermissions() {
        const defaultPermissions = [
            { name: 'users:create', resource: 'users', action: 'create', description: 'Create new users' },
            { name: 'users:read', resource: 'users', action: 'read', description: 'Read user data' },
            { name: 'users:update', resource: 'users', action: 'update', description: 'Update user data' },
            { name: 'users:delete', resource: 'users', action: 'delete', description: 'Delete users' },
            { name: 'roles:create', resource: 'roles', action: 'create', description: 'Create new roles' },
            { name: 'roles:read', resource: 'roles', action: 'read', description: 'Read role data' },
            { name: 'roles:update', resource: 'roles', action: 'update', description: 'Update roles' },
            { name: 'roles:delete', resource: 'roles', action: 'delete', description: 'Delete roles' },
            { name: 'roles:assign', resource: 'roles', action: 'assign', description: 'Assign roles to users' },
            { name: 'access:request', resource: 'access', action: 'request', description: 'Submit a request for privileged resource access' },
            { name: 'access:approve', resource: 'access', action: 'approve', description: 'Approve or reject access requests' },
            { name: 'access:revoke', resource: 'access', action: 'revoke', description: 'Revoke previously granted access' },
            { name: 'access:read', resource: 'access', action: 'read', description: 'View all access requests and their status' },
            { name: 'audit:read', resource: 'audit', action: 'read', description: 'Read raw audit logs and suspicious activity reports' },
            { name: 'reports:read', resource: 'reports', action: 'read', description: 'Read reports' },
            { name: 'reports:export', resource: 'reports', action: 'export', description: 'Export reports — restricted to trusted IPs' },
            { name: 'invoices:approve', resource: 'invoices', action: 'approve', description: 'Approve invoices — requires MFA, weekdays only, fresh session' },
            { name: 'bonus:approve', resource: 'bonus', action: 'approve', description: 'Approve bonus payouts' },
        ];
        for (const perm of defaultPermissions) {
            await this.permissionModel.findOneAndUpdate({ name: perm.name }, { $setOnInsert: perm }, { upsert: true, new: true });
        }
    }
};
exports.PermissionsService = PermissionsService;
exports.PermissionsService = PermissionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(permission_schema_1.Permission.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], PermissionsService);
//# sourceMappingURL=permissions.service.js.map