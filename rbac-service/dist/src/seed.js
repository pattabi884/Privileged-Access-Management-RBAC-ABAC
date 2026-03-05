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
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = __importStar(require("bcrypt"));
const user_schema_1 = require("./infrastructure/database/schemas/user.schema");
const role_schema_1 = require("./infrastructure/database/schemas/role.schema");
const user_role_schema_1 = require("./infrastructure/database/schemas/user-role.schema");
const permissions_service_1 = require("./modules/rbac/permissions/permissions.service");
const rbac_cache_service_1 = require("./infrastructure/cache/rbac-cache.service");
async function seed() {
    console.log('\n🌱 Starting RBAC seed...\n');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule, {
        logger: ['error', 'warn'],
    });
    const userModel = app.get((0, mongoose_1.getModelToken)(user_schema_1.User.name));
    const roleModel = app.get((0, mongoose_1.getModelToken)(role_schema_1.Role.name));
    const userRoleModel = app.get((0, mongoose_1.getModelToken)(user_role_schema_1.UserRole.name));
    const permissionsService = app.get(permissions_service_1.PermissionsService);
    const cacheService = app.get(rbac_cache_service_1.RbacCacheService);
    console.log('📋 Seeding permissions...');
    await permissionsService.seedPermissions();
    console.log('   ✓ Permissions seeded');
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
    }
    else {
        if (!superAdminRole.permissions.includes('*:*')) {
            superAdminRole.permissions.push('*:*');
            await superAdminRole.save();
        }
        console.log('   ✓ super-admin role already exists — skipped');
    }
    const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@sentry.dev';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@1234';
    const adminName = process.env.ADMIN_NAME ?? 'System Admin';
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
    }
    else {
        console.log(`   ✓ Admin user already exists — skipped`);
    }
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
        await cacheService.addUserToRoleIndex(superAdminRole._id.toString(), adminUser._id.toString());
        console.log('   ✓ Role assigned');
    }
    else {
        console.log('   ✓ Role already assigned — skipped');
    }
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
//# sourceMappingURL=seed.js.map