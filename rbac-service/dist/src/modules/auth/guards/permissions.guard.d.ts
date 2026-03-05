import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditService } from 'src/modules/rbac/audit/audit.service';
import { ContextEvaluatorService } from 'src/modules/rbac/context/context-evaluator.service';
import { UserRolesService } from 'src/modules/rbac/user-roles/user-roles.service';
export declare class PermissionsGuard implements CanActivate {
    private reflector;
    private userRolesService;
    private contextEvaluator;
    private auditService;
    private readonly logger;
    constructor(reflector: Reflector, userRolesService: UserRolesService, contextEvaluator: ContextEvaluatorService, auditService: AuditService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private buildContext;
    private extractResourceType;
    private isDeviceTrusted;
}
