import { UserRolesService } from './user-roles.service';
import { AssignRoleDto } from './dto/assign-role.dto';
export declare class UserRolesController {
    private readonly userRolesService;
    constructor(userRolesService: UserRolesService);
    assignRole(dto: AssignRoleDto): Promise<import("../../../infrastructure/database/schemas/user-role.schema").UserRole>;
    removeRole(userId: string, roleId: string): Promise<void>;
    getUserRoles(userId: string): Promise<import("../../../infrastructure/database/schemas/role.schema").Role[]>;
    getUserPermissions(userId: string): Promise<string[]>;
    getUsersWithRole(roleId: string): Promise<string[]>;
}
