/**
 * seed-standalone.ts
 * Direct MongoDB seed — no NestJS context, no Redis required.
 * Run: npx ts-node seed-standalone.ts
 */

import mongoose, { Schema, model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/PAM_db';
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? 'admin@sentry.dev';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
const ADMIN_NAME     = process.env.ADMIN_NAME     ?? 'System Admin';

// ── Schemas (minimal — just enough to write the docs) ─────────────────────────

const PermissionSchema = new Schema({
  action:      { type: String, required: true },
  resource:    { type: String, required: true },
  description: String,
  isActive:    { type: Boolean, default: true },
}, { timestamps: true, collection: 'permissions' });
PermissionSchema.index({ action: 1, resource: 1 }, { unique: true });

const RoleSchema = new Schema({
  name:        { type: String, required: true, unique: true },
  description: String,
  permissions: [String],   // stored as "resource:action" strings
  isSystemRole:{ type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true, collection: 'roles' });

const UserSchema = new Schema({
  email:        { type: String, required: true, unique: true },
  name:         String,
  passwordHash: String,
  department:   String,
  isActive:     { type: Boolean, default: true },
  mfaVerified:  { type: Boolean, default: false },
}, { timestamps: true, collection: 'users' });

const UserRoleSchema = new Schema({
  userId:     { type: String, required: true },
  roleId:     { type: String, required: true },
  assignedAt: { type: Date, default: Date.now },
  assignedBy: { type: String, default: 'seed-script' },
}, { timestamps: true, collection: 'userroles' });

const PermissionModel = model('Permission', PermissionSchema);
const RoleModel       = model('Role', RoleSchema);
const UserModel       = model('User', UserSchema);
const UserRoleModel   = model('UserRole', UserRoleSchema);

// ── Permissions to seed ────────────────────────────────────────────────────────

const DEFAULT_PERMISSIONS = [
  // Access requests
  { resource: 'access', action: 'request',  description: 'Submit access requests' },
  { resource: 'access', action: 'read',     description: 'View access requests' },
  { resource: 'access', action: 'approve',  description: 'Approve/deny access requests' },
  { resource: 'access', action: 'revoke',   description: 'Revoke access grants' },
  // Users
  { resource: 'users',  action: 'read',     description: 'View user list' },
  { resource: 'users',  action: 'create',   description: 'Create users' },
  { resource: 'users',  action: 'update',   description: 'Update users' },
  { resource: 'users',  action: 'delete',   description: 'Delete users' },
  // Roles
  { resource: 'roles',  action: 'read',     description: 'View roles' },
  { resource: 'roles',  action: 'create',   description: 'Create roles' },
  { resource: 'roles',  action: 'update',   description: 'Update roles' },
  { resource: 'roles',  action: 'delete',   description: 'Delete roles' },
  // Permissions
  { resource: 'permissions', action: 'read',   description: 'View permissions' },
  { resource: 'permissions', action: 'create', description: 'Create permissions' },
  { resource: 'permissions', action: 'seed',   description: 'Seed default permissions' },
  // Audit
  { resource: 'audit',  action: 'read',     description: 'View audit logs' },
  { resource: 'audit',  action: 'export',   description: 'Export audit logs' },
  // System
  { resource: 'system', action: 'admin',    description: 'System administration' },
];

// ── Roles to seed ──────────────────────────────────────────────────────────────

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
      'access:request','access:read','access:approve','access:revoke',
      'users:read','users:create','users:update','users:delete',
      'roles:read','roles:create','roles:update','roles:delete',
      'permissions:read','permissions:create','permissions:seed',
      'audit:read','audit:export',
    ],
    isSystemRole: true,
  },
  {
    name: 'security_analyst',
    description: 'Security monitoring and audit access',
    permissions: ['access:read','access:approve','audit:read','users:read'],
    isSystemRole: false,
  },
  {
    name: 'manager',
    description: 'Team manager — can approve requests for their team',
    permissions: ['access:read','access:approve','users:read'],
    isSystemRole: false,
  },
  {
    name: 'employee',
    description: 'Standard employee — can request access',
    permissions: ['access:request','access:read'],
    isSystemRole: false,
  },
];

// ── Main ───────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Starting standalone seed...');
  console.log(`   Connecting to: ${MONGODB_URI}\n`);

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // Drop any stale indexes that can cause conflicts
  try {
    await PermissionModel.collection.dropIndex('name_1');
    console.log('🧹 Dropped stale name_1 index on permissions\n');
  } catch (_) { /* index didn't exist — fine */ }

  // 1. Permissions
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

  // 2. Roles
  console.log('👑 Seeding roles...');
  const roleIds: Record<string, string> = {};
  for (const r of DEFAULT_ROLES) {
    let role = await RoleModel.findOne({ name: r.name });
    if (!role) {
      role = await RoleModel.create(r);
      console.log(`   + ${r.name}`);
    } else {
      // Ensure permissions are up to date
      role.permissions = r.permissions as string[];
      await role.save();
      console.log(`   ~ ${r.name} (updated permissions)`);
    }
    roleIds[r.name] = (role._id as mongoose.Types.ObjectId).toString();
  }
  console.log(`   ✓ ${DEFAULT_ROLES.length} roles ready\n`);

  // 3. Admin user
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
  } else {
    console.log('   ✓ Admin user already exists — skipped\n');
  }

  // 4. Assign super-admin role
  console.log('🔗 Assigning super-admin role to admin...');
  const userId = (adminUser._id as mongoose.Types.ObjectId).toString();
  const superAdminRoleId = roleIds['super-admin'];

  const existing = await UserRoleModel.findOne({ userId, roleId: superAdminRoleId });
  if (!existing) {
    await UserRoleModel.create({ userId, roleId: superAdminRoleId });
    console.log('   ✓ Role assigned\n');
  } else {
    console.log('   ✓ Already assigned — skipped\n');
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  const counts = {
    permissions: await PermissionModel.countDocuments(),
    roles:       await RoleModel.countDocuments(),
    users:       await UserModel.countDocuments(),
    userRoles:   await UserRoleModel.countDocuments(),
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

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message ?? err);
  process.exit(1);
});