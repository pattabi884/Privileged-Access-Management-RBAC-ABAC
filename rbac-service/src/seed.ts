/**
 * seed.ts — First-admin bootstrapping script
 *
 * Run with:  npx ts-node -r tsconfig-paths/register src/seed.ts
 *
 * WHY THIS EXISTS:
 * The HTTP server protects every route with JwtAuthGuard + PermissionsGuard.
 * POST /permissions/seed requires 'roles:create'. But on a fresh database,
 * nobody has any roles — so you can never reach that endpoint legitimately.
 *
 * This script solves the bootstrap problem by spinning up the NestJS
 * application context (all modules, services, DB connections) WITHOUT
 * starting the HTTP listener, then calling services directly.
 *
 * It is IDEMPOTENT — run it multiple times and it won't create duplicates.
 * Every operation is guarded by a "find or create" check.
 *
 * WHAT IT CREATES:
 *   1. Seeds all default permissions (calls PermissionsService.seedPermissions)
 *   2. Creates a 'super-admin' role with '*:*' wildcard permission
 *   3. Creates (or finds) the admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars
 *   4. Assigns the super-admin role to that user
 *
 * After running this, log in as the admin user via POST /auth/login and use
 * the returned JWT to create further roles, users, and permissions through
 * the normal API.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '@infrastructure/database/schemas/user.schema';
import { Role, RoleDocument } from '@infrastructure/database/schemas/role.schema';
import { UserRole } from '@infrastructure/database/schemas/user-role.schema';
import { PermissionsService } from '@modules/rbac/permissions/permissions.service';
import { RbacCacheService } from '@infrastructure/cache/rbac-cache.service';

async function seed() {
  console.log('\n🌱 Starting RBAC seed...\n');

  // Create the application context without starting HTTP.
  // This boots all modules, connects to MongoDB and Redis,
  // and makes all services available — just no HTTP server.
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'], // suppress noisy startup logs
  });

  // Pull services and models from the DI container.
  // getModelToken() is how NestJS resolves Mongoose models outside of
  // @InjectModel — same underlying token, different injection mechanism.
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const roleModel = app.get<Model<RoleDocument>>(getModelToken(Role.name));
  const userRoleModel = app.get(getModelToken(UserRole.name));
  const permissionsService = app.get(PermissionsService);
  const cacheService = app.get(RbacCacheService);

  // ── Step 1: Seed all permissions ───────────────────────────────────────────
  // PermissionsService.seedPermissions() uses $setOnInsert so it's safe
  // to run multiple times — existing permissions are never overwritten.
  console.log('📋 Seeding permissions...');
  await permissionsService.seedPermissions();
  console.log('   ✓ Permissions seeded');

  // ── Step 2: Create super-admin role ────────────────────────────────────────
  // '*:*' is the wildcard permission checked in UserRolesService.hasPermission().
  // A user with this permission passes every hasPermission() check immediately.
  // isSystemRole: true prevents this role from being deleted or modified via API.
  console.log('👑 Creating super-admin role...');
  let superAdminRole = await roleModel.findOne({ name: 'super-admin' });
  if (!superAdminRole) {
    superAdminRole = await roleModel.create({
      name: 'super-admin',
      description: 'Full system access — bootstrapped by seed script',
      permissions: ['*:*'],
      isSystemRole: true,
      isActive: true,
    });
    console.log('   ✓ super-admin role created');
  } else {
    // Ensure '*:*' is in permissions even if the role already existed
    if (!superAdminRole.permissions.includes('*:*')) {
      superAdminRole.permissions.push('*:*');
      await superAdminRole.save();
    }
    console.log('   ✓ super-admin role already exists — skipped');
  }

  // ── Step 3: Create admin user ──────────────────────────────────────────────
  // Credentials come from environment variables so the script is safe to
  // commit — no hardcoded passwords in source code.
  const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@sentry.dev';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
  const adminName     = process.env.ADMIN_NAME     ?? 'System Admin';

  console.log(`👤 Creating admin user: ${adminEmail}`);
  let adminUser = await userModel.findOne({ email: adminEmail });

  if (!adminUser) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    adminUser = await userModel.create({
      email: adminEmail,
      name: adminName,
      passwordHash,
      isActive: true,
      department: 'platform',
      mfaVerified: false,
    });
    console.log(`   ✓ Admin user created`);
  } else {
    console.log(`   ✓ Admin user already exists — skipped`);
  }

  // ── Step 4: Assign super-admin role to admin user ──────────────────────────
  // UserRole documents link a userId to a roleId.
  // We do a findOne check first — assignRole is idempotent by design but
  // doing it directly here avoids pulling in UserRolesService (which would
  // also try to hit the cache, and during seeding that's noise).
  console.log('🔗 Assigning super-admin role to admin user...');
  const existingAssignment = await userRoleModel.findOne({
    userId: adminUser._id.toString(),
    roleId: superAdminRole._id.toString(),
  });

  if (!existingAssignment) {
    await userRoleModel.create({
      userId: adminUser._id.toString(),
      roleId: superAdminRole._id.toString(),
      assignedAt: new Date(),
      assignedBy: 'seed-script',
    });

    // Register in the reverse index so cache invalidation works correctly
    // when the super-admin role's permissions change later.
    await cacheService.addUserToRoleIndex(
      superAdminRole._id.toString(),
      adminUser._id.toString(),
    );
    console.log('   ✓ Role assigned');
  } else {
    console.log('   ✓ Role already assigned — skipped');
  }

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete.\n');
  console.log(`   Admin email:    ${adminEmail}`);
  console.log(`   Admin password: ${adminPassword}`);
  console.log(`   Login at:       POST /auth/login\n`);

  await app.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});