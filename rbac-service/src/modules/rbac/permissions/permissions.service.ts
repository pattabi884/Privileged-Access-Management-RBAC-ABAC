
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Permission, PermissionDocument } from 'src/infrastructure/database/schemas/permission.schema';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectModel(Permission.name)
    private permissionModel: Model<PermissionDocument>,
  ) {}

  async create(dto: CreatePermissionDto): Promise<PermissionDocument> {
    const existing = await this.permissionModel.findOne({ name: dto.name });
    if (existing) {
      throw new ConflictException(`Permission ${dto.name} already exists`);
    }
    const permission = new this.permissionModel(dto);
    return permission.save();
  }

  async findAll(): Promise<PermissionDocument[]> {
    return this.permissionModel.find().sort({ resource: 1, action: 1 });
  }

  async findOne(id: string): Promise<PermissionDocument> {
    const permission = await this.permissionModel.findById(id);
    if (!permission) {
      throw new NotFoundException(`Permission ${id} not found`);
    }
    return permission;
  }

  async findByResource(resource: string): Promise<PermissionDocument[]> {
    return this.permissionModel
      .find({ resource, isActive: true })
      .sort({ action: 1 });
  }

  async update(id: string, dto: UpdatePermissionDto): Promise<PermissionDocument> {
    const permission = await this.permissionModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { returnDocument: 'after' },
    );
    if (!permission) {
      throw new NotFoundException(`Permission ${id} not found`);
    }
    return permission;
  }

  async deactivate(id: string): Promise<PermissionDocument> {
    const permission = await this.permissionModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { returnDocument: 'after' },
    );
    if (!permission) {
      throw new NotFoundException(`Permission ${id} not found`);
    }
    return permission;
  }

  async validatePermissions(names: string[]): Promise<boolean> {
    const found = await this.permissionModel.countDocuments({
      name: { $in: names },
      isActive: true,
    });
    return found === names.length;
  }

  // HOW TO RUN: POST /permissions/seed (requires roles:create permission)
  
  async seedPermissions(): Promise<void> {
    const defaultPermissions = [
      // Users
      { name: 'users:create',    resource: 'users',     action: 'create',  description: 'Create new users' },
      { name: 'users:read',      resource: 'users',     action: 'read',    description: 'Read user data' },
      { name: 'users:update',    resource: 'users',     action: 'update',  description: 'Update user data' },
      { name: 'users:delete',    resource: 'users',     action: 'delete',  description: 'Delete users' },

      // Roles
      { name: 'roles:create',    resource: 'roles',     action: 'create',  description: 'Create new roles' },
      { name: 'roles:read',      resource: 'roles',     action: 'read',    description: 'Read role data' },
      { name: 'roles:update',    resource: 'roles',     action: 'update',  description: 'Update roles' },
      { name: 'roles:delete',    resource: 'roles',     action: 'delete',  description: 'Delete roles' },
      { name: 'roles:assign',    resource: 'roles',     action: 'assign',  description: 'Assign roles to users' },
  { name: 'access:request',  resource: 'access',    action: 'request', description: 'Submit a request for privileged resource access' },
      { name: 'access:approve',  resource: 'access',    action: 'approve', description: 'Approve or reject access requests' },
      { name: 'access:revoke',   resource: 'access',    action: 'revoke',  description: 'Revoke previously granted access' },
      { name: 'access:read',     resource: 'access',    action: 'read',    description: 'View all access requests and their status' },

      // ── PAM: Audit ───────────────────────────────────────────────────────────
    
      { name: 'audit:read',      resource: 'audit',     action: 'read',    description: 'Read raw audit logs and suspicious activity reports' },

   
      { name: 'reports:read',    resource: 'reports',   action: 'read',    description: 'Read reports' },
      { name: 'reports:export',  resource: 'reports',   action: 'export',  description: 'Export reports — restricted to trusted IPs' },
      { name: 'invoices:approve',resource: 'invoices',  action: 'approve', description: 'Approve invoices — requires MFA, weekdays only, fresh session' },
      { name: 'bonus:approve',   resource: 'bonus',     action: 'approve', description: 'Approve bonus payouts' },
    ];

    for (const perm of defaultPermissions) {
      await this.permissionModel.findOneAndUpdate(
        { name: perm.name },
        { $setOnInsert: perm },
        { upsert: true, new: true },
      );
    }
  }
}