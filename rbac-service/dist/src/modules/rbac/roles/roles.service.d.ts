import { Model } from 'mongoose';
import { RoleDocument } from '@infrastructure/database/schemas/role.schema';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RbacCacheService } from '@infrastructure/cache/rbac-cache.service';
export declare class RolesService {
    private roleModel;
    private rbacCacheService;
    constructor(roleModel: Model<RoleDocument>, rbacCacheService: RbacCacheService);
    create(createRoleDto: CreateRoleDto): Promise<RoleDocument>;
    findAll(): Promise<RoleDocument[]>;
    findOne(id: string): Promise<RoleDocument>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<RoleDocument>;
    addPermission(roleId: string, permission: string): Promise<RoleDocument>;
    removePermission(roleId: string, permission: string): Promise<RoleDocument>;
    remove(id: string): Promise<void>;
    getRolePermissions(roleId: string): Promise<string[]>;
}
