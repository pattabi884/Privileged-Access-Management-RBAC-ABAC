import { Model } from 'mongoose';
import { UserRole } from '@infrastructure/database/schemas/user-role.schema';
import { Role } from '@infrastructure/database/schemas/role.schema';
import { RbacCacheService } from 'src/infrastructure/cache/rbac-cache.service';
export declare class UserRolesService {
    private readonly userRoleModel;
    private readonly roleModel;
    private readonly rbacCacheService;
    constructor(userRoleModel: Model<UserRole>, roleModel: Model<Role>, rbacCacheService: RbacCacheService);
    assignRole(userId: string, roleId: string, assignedBy: string): Promise<UserRole>;
    removeRole(userId: string, roleId: string): Promise<void>;
    getUserRoles(userId: string): Promise<Role[]>;
    getUserPermissions(userId: string): Promise<string[]>;
    hasPermission(userId: string, requiredPermission: string): Promise<boolean>;
    getUsersWithRole(roleId: string): Promise<string[]>;
}
