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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bcrypt = __importStar(require("bcrypt"));
const user_schema_1 = require("../../infrastructure/database/schemas/user.schema");
const login_dto_1 = require("./dto/login.dto");
const public_decorator_1 = require("./decorators/public.decorator");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const user_roles_service_1 = require("../rbac/user-roles/user-roles.service");
const context_evaluator_service_1 = require("../rbac/context/context-evaluator.service");
const auth_utils_1 = require("../../common/utils/auth.utils");
let AuthController = AuthController_1 = class AuthController {
    constructor(jwtService, userModel, userRolesService, contextEvaluator) {
        this.jwtService = jwtService;
        this.userModel = userModel;
        this.userRolesService = userRolesService;
        this.contextEvaluator = contextEvaluator;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async register(body) {
        this.logger.log(`Register attempt for email: ${body.email}`);
        const existing = await this.userModel.findOne({ email: body.email });
        if (existing) {
            throw new common_1.UnauthorizedException('Email already registered');
        }
        const passwordHash = await bcrypt.hash(body.password, 10);
        const user = new this.userModel({
            email: body.email,
            name: body.name,
            passwordHash,
            department: body.department ?? null,
        });
        const saved = await user.save();
        this.logger.log(`User registered successfully: ${saved.email}`);
        return {
            message: 'User registered successfully',
            userId: saved._id,
            email: saved.email,
            name: saved.name,
            department: saved.department ?? null,
        };
    }
    async login(dto) {
        this.logger.log(`Login attempt for email: ${dto.email}`);
        const user = await this.userModel.findOne({ email: dto.email });
        if (!user) {
            this.logger.warn(`Login failed — email not found: ${dto.email}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (!user.isActive) {
            this.logger.warn(`Login failed — account deactivated: ${dto.email}`);
            throw new common_1.UnauthorizedException('Account is deactivated');
        }
        const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            this.logger.warn(`Login failed — wrong password for: ${dto.email}`);
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = {
            userId: user._id.toString(),
            email: user.email,
            loginTime: new Date(),
            department: user.department ?? null,
            mfaVerified: user.mfaVerified ?? false,
        };
        const token = this.jwtService.sign(payload);
        this.logger.log(`Login successful for: ${dto.email}`);
        await this.userModel.findByIdAndUpdate(user._id, {
            $set: { lastLoginAt: new Date() },
        });
        return {
            access_token: token,
            userId: user._id,
            email: user.email,
            name: user.name,
        };
    }
    async me(req) {
        this.logger.log(`/auth/me called for user: ${req.user.email}`);
        return {
            userId: req.user.userId,
            email: req.user.email,
            name: req.user.name,
            department: req.user.department ?? null,
            mfaVerified: req.user.mfaVerified ?? false,
        };
    }
    async checkPermission(req, body) {
        this.logger.log(`Permission check: ${req.user.email} -> ${body.permission}`);
        const hasBasicPermission = await this.userRolesService.hasPermission(req.user.userId, body.permission);
        if (!hasBasicPermission) {
            this.logger.warn(`DENIED — ${req.user.email} does not have: ${body.permission}`);
            return {
                granted: false,
                reason: 'Permission not assigned to user',
                evaluatedRules: [],
                userId: req.user.userId,
                permission: body.permission,
            };
        }
        const permissionContext = {
            userId: req.user.userId,
            userEmail: req.user.email,
            userDepartment: req.user.department ?? undefined,
            resourceType: body.context?.resourceType ?? 'unknown',
            resourceId: body.context?.resourceId,
            resourceDepartment: body.context?.resourceDepartment,
            resourceOwnerId: body.context?.resourceOwnerId,
            ipAddress: body.context?.ipAddress ?? 'unknown',
            userAgent: body.context?.userAgent ?? 'unknown',
            timestamp: new Date(),
            hasMFA: req.user.mfaVerified ?? false,
            sessionAge: (0, auth_utils_1.calculateSessionAge)(req.user.loginTime),
            deviceTrusted: false,
        };
        const decision = this.contextEvaluator.evaluatePermission(body.permission, permissionContext);
        this.logger.log(`check-permission result: ${body.permission} -> ${decision.granted ? 'GRANTED' : 'DENIED'} — ${decision.reason}`);
        return {
            granted: decision.granted,
            reason: decision.reason,
            evaluatedRules: decision.evaluatedRules,
            userId: req.user.userId,
            permission: body.permission,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('check-permission'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkPermission", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __param(1, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        mongoose_2.Model,
        user_roles_service_1.UserRolesService,
        context_evaluator_service_1.ContextEvaluatorService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map