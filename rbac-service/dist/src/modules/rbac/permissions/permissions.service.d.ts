import { Model } from 'mongoose';
import { PermissionDocument } from 'src/infrastructure/database/schemas/permission.schema';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
export declare class PermissionsService {
    private permissionModel;
    constructor(permissionModel: Model<PermissionDocument>);
    create(dto: CreatePermissionDto): Promise<PermissionDocument>;
    findAll(): Promise<PermissionDocument[]>;
    findOne(id: string): Promise<PermissionDocument>;
    findByResource(resource: string): Promise<PermissionDocument[]>;
    update(id: string, dto: UpdatePermissionDto): Promise<PermissionDocument>;
    deactivate(id: string): Promise<PermissionDocument>;
    validatePermissions(names: string[]): Promise<boolean>;
    seedPermissions(): Promise<void>;
}
