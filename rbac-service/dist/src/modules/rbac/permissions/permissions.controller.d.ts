import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
export declare class PermissionsController {
    private readonly permissionsService;
    constructor(permissionsService: PermissionsService);
    create(dto: CreatePermissionDto): Promise<import("../../../infrastructure/database/schemas/permission.schema").PermissionDocument>;
    findAll(): Promise<import("../../../infrastructure/database/schemas/permission.schema").PermissionDocument[]>;
    findByResource(resource: string): Promise<import("../../../infrastructure/database/schemas/permission.schema").PermissionDocument[]>;
    findOne(id: string): Promise<import("../../../infrastructure/database/schemas/permission.schema").PermissionDocument>;
    update(id: string, dto: UpdatePermissionDto): Promise<import("../../../infrastructure/database/schemas/permission.schema").PermissionDocument>;
    deactivate(id: string): Promise<import("../../../infrastructure/database/schemas/permission.schema").PermissionDocument>;
    seed(): Promise<void>;
}
