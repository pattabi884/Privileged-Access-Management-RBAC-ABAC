"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RbacModule = void 0;
const common_1 = require("@nestjs/common");
const roles_module_1 = require("./roles/roles.module");
const permissions_module_1 = require("./permissions/permissions.module");
const user_roles_module_1 = require("./user-roles/user-roles.module");
const context_evaluator_service_1 = require("./context/context-evaluator.service");
const audit_module_1 = require("./audit/audit.module");
let RbacModule = class RbacModule {
};
exports.RbacModule = RbacModule;
exports.RbacModule = RbacModule = __decorate([
    (0, common_1.Module)({
        imports: [
            roles_module_1.RolesModule,
            permissions_module_1.PermissionsModule,
            user_roles_module_1.UserRolesModule,
            audit_module_1.AuditModule,
        ],
        providers: [
            context_evaluator_service_1.ContextEvaluatorService,
        ],
        exports: [
            roles_module_1.RolesModule,
            permissions_module_1.PermissionsModule,
            user_roles_module_1.UserRolesModule,
            context_evaluator_service_1.ContextEvaluatorService,
            audit_module_1.AuditModule,
        ],
    })
], RbacModule);
//# sourceMappingURL=rbac.module.js.map