"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const bcrypt = __importStar(require("bcrypt"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/PAM_db';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@sentry.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
const ADMIN_NAME = process.env.ADMIN_NAME ?? 'System Admin';
const PermissionSchema = new mongoose_1.Schema({
    action: { type: String, required: true },
    resource: { type: String, required: true },
    description: String,
    isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'permissions' });
PermissionSchema.index({ action: 1, resource: 1 }, { unique: true });
const RoleSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: String,
    permissions: [String],
    isSystemRole: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
}, { timestamps: true, collection: 'roles' });
const UserSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    name: String,
    passwordHash: String,
    department: String,
    isActive: { type: Boolean, default: true },
    mfaVerified: { type: Boolean, default: false },
}, { timestamps: true, collection: 'users' });
const UserRoleSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    roleId: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: { type: String, default: 'seed-script' },
}, { timestamps: true, collection: 'userroles' });
const PermissionModel = (0, mongoose_1.model)('Permission', PermissionSchema);
const RoleModel = (0, mongoose_1.model)('Role', RoleSchema);
const UserModel = (0, mongoose_1.model)('User', UserSchema);
const UserRoleModel = (0, mongoose_1.model)('UserRole', UserRoleSchema);
const DEFAULT_PERMISSIONS = [
    { resource: 'access', action: 'request', description: 'Submit access requests' },
    { resource: 'access', action: 'read', description: 'View access requests' },
    { resource: 'access', action: 'approve', description: 'Approve/deny access requests' },
    { resource: 'access', action: 'revoke', description: 'Revoke access grants' },
    { resource: 'users', action: 'read', description: 'View user list' },
    { resource: 'users', action: 'create', description: 'Create users' },
    { resource: 'users', action: 'update', description: 'Update users' },
    { resource: 'users', action: 'delete', description: 'Delete users' },
    { resource: 'roles', action: 'read', description: 'View roles' },
    { resource: 'roles', action: 'create', description: 'Create roles' },
    { resource: 'roles', action: 'update', description: 'Update roles' },
    { resource: 'roles', action: 'delete', description: 'Delete roles' },
    { resource: 'permissions', action: 'read', description: 'View permissions' },
    { resource: 'permissions', action: 'create', description: 'Create permissions' },
    { resource: 'permissions', action: 'seed', description: 'Seed default permissions' },
    { resource: 'audit', action: 'read', description: 'View audit logs' },
    { resource: 'audit', action: 'export', description: 'Export audit logs' },
    { resource: 'system', action: 'admin', description: 'System administration' },
];
const DEFAULT_ROLES = [
    {
        name: 'super-admin',
        description: 'Full system access',
        permissions: ['*:*'],
        isSystemRole: true,
    },
    {
        name: 'admin',
        description: 'Administrative access',
        permissions: [
            'access:request', 'access:read', 'access:approve', 'access:revoke',
            'users:read', 'users:create', 'users:update', 'users:delete',
            'roles:read', 'roles:create', 'roles:update', 'roles:delete',
            'permissions:read', 'permissions:create', 'permissions:seed',
            'audit:read', 'audit:export',
        ],
        isSystemRole: true,
    },
    {
        name: 'security_analyst',
        description: 'Security monitoring and audit access',
        permissions: ['access:read', 'access:approve', 'audit:read', 'users:read'],
        isSystemRole: false,
    },
    {
        name: 'manager',
        description: 'Team manager — can approve requests for their team',
        permissions: ['access:read', 'access:approve', 'users:read'],
        isSystemRole: false,
    },
    {
        name: 'employee',
        description: 'Standard employee — can request access',
        permissions: ['access:request', 'access:read'],
        isSystemRole: false,
    },
];
async function seed() {
    console.log('\n🌱 Starting standalone seed...');
    console.log(`   Connecting to: ${MONGODB_URI}\n`);
    await mongoose_1.default.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    try {
        await PermissionModel.collection.dropIndex('name_1');
        console.log('🧹 Dropped stale name_1 index on permissions\n');
    }
    catch (_) { }
    console.log('📋 Seeding permissions...');
    let permCount = 0;
    for (const p of DEFAULT_PERMISSIONS) {
        const key = `${p.resource}:${p.action}`;
        const exists = await PermissionModel.findOne({ resource: p.resource, action: p.action });
        if (!exists) {
            await PermissionModel.create(p);
            console.log(`   + ${key}`);
            permCount++;
        }
    }
    console.log(`   ✓ ${permCount} new permissions created (${DEFAULT_PERMISSIONS.length - permCount} already existed)\n`);
    console.log('👑 Seeding roles...');
    const roleIds = {};
    for (const r of DEFAULT_ROLES) {
        let role = await RoleModel.findOne({ name: r.name });
        if (!role) {
            role = await RoleModel.create(r);
            console.log(`   + ${r.name}`);
        }
        else {
            role.permissions = r.permissions;
            await role.save();
            console.log(`   ~ ${r.name} (updated permissions)`);
        }
        roleIds[r.name] = role._id.toString();
    }
    console.log(`   ✓ ${DEFAULT_ROLES.length} roles ready\n`);
    console.log(`👤 Creating admin user: ${ADMIN_EMAIL}`);
    let adminUser = await UserModel.findOne({ email: ADMIN_EMAIL });
    if (!adminUser) {
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
        adminUser = await UserModel.create({
            email: ADMIN_EMAIL,
            name: ADMIN_NAME,
            passwordHash,
            department: 'platform',
            isActive: true,
            mfaVerified: false,
        });
        console.log('   ✓ Admin user created\n');
    }
    else {
        console.log('   ✓ Admin user already exists — skipped\n');
    }
    console.log('🔗 Assigning super-admin role to admin...');
    const userId = adminUser._id.toString();
    const superAdminRoleId = roleIds['super-admin'];
    const existing = await UserRoleModel.findOne({ userId, roleId: superAdminRoleId });
    if (!existing) {
        await UserRoleModel.create({ userId, roleId: superAdminRoleId });
        console.log('   ✓ Role assigned\n');
    }
    else {
        console.log('   ✓ Already assigned — skipped\n');
    }
    const counts = {
        permissions: await PermissionModel.countDocuments(),
        roles: await RoleModel.countDocuments(),
        users: await UserModel.countDocuments(),
        userRoles: await UserRoleModel.countDocuments(),
    };
    console.log('─'.repeat(40));
    console.log('✅ Seed complete!\n');
    console.log(`   DB:             ${MONGODB_URI}`);
    console.log(`   Permissions:    ${counts.permissions}`);
    console.log(`   Roles:          ${counts.roles}`);
    console.log(`   Users:          ${counts.users}`);
    console.log(`   UserRoles:      ${counts.userRoles}`);
    console.log(`\n   Admin email:    ${ADMIN_EMAIL}`);
    console.log(`   Admin password: ${ADMIN_PASSWORD}`);
    console.log('─'.repeat(40) + '\n');
    await mongoose_1.default.disconnect();
    process.exit(0);
}
seed().catch((err) => {
    console.error('\n❌ Seed failed:', err.message ?? err);
    process.exit(1);
});
//# sourceMappingURL=seed-standalone.js.map