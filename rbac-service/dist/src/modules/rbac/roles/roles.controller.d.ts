import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AddPermissionDto } from './dto/add-permission.dto';
export declare class RolesController {
    private readonly rolesService;
    constructor(rolesService: RolesService);
    create(createRoleDto: CreateRoleDto): Promise<import("../../../infrastructure/database/schemas/role.schema").RoleDocument>;
    findAll(): Promise<import("../../../infrastructure/database/schemas/role.schema").RoleDocument[]>;
    findOne(id: string): Promise<import("../../../infrastructure/database/schemas/role.schema").RoleDocument>;
    update(id: string, updateRoleDto: UpdateRoleDto): Promise<import("../../../infrastructure/database/schemas/role.schema").RoleDocument>;
    addPermission(id: string, dto: AddPermissionDto): Promise<import("../../../infrastructure/database/schemas/role.schema").RoleDocument>;
    removePermission(id: string, permission: string): Promise<import("../../../infrastructure/database/schemas/role.schema").RoleDocument>;
    remove(id: string): Promise<void>;
}
