import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { UserDocument } from '@infrastructure/database/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { UserRolesService } from '../rbac/user-roles/user-roles.service';
import { ContextEvaluatorService } from '../rbac/context/context-evaluator.service';
export declare class AuthController {
    private jwtService;
    private userModel;
    private userRolesService;
    private contextEvaluator;
    private readonly logger;
    constructor(jwtService: JwtService, userModel: Model<UserDocument>, userRolesService: UserRolesService, contextEvaluator: ContextEvaluatorService);
    register(body: {
        email: string;
        name: string;
        password: string;
        department?: string;
    }): Promise<{
        message: string;
        userId: import("mongoose").Types.ObjectId;
        email: string;
        name: string;
        department: string | null;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        userId: import("mongoose").Types.ObjectId;
        email: string;
        name: string;
    }>;
    me(req: any): Promise<{
        userId: any;
        email: any;
        name: any;
        department: any;
        mfaVerified: any;
    }>;
    checkPermission(req: any, body: {
        permission: string;
        context?: {
            ipAddress?: string;
            userAgent?: string;
            resourceId?: string;
            resourceType?: string;
            resourceDepartment?: string;
            resourceOwnerId?: string;
        };
    }): Promise<{
        granted: boolean;
        reason: string;
        evaluatedRules: string[];
        userId: any;
        permission: string;
    }>;
}
