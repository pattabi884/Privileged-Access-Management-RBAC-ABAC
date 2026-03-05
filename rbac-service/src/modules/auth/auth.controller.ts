// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UnauthorizedException,
  Logger,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '@infrastructure/database/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserRolesService } from '../rbac/user-roles/user-roles.service';
import { ContextEvaluatorService } from '../rbac/context/context-evaluator.service';
import { PermissionContext } from '../rbac/context/permission-context.interface';
import { calculateSessionAge } from '../../common/utils/auth.utils';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private jwtService: JwtService,

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    private userRolesService: UserRolesService,

    // Needed so /auth/check-permission runs the full context evaluation,
    // not just the raw permission string check. Without this, a downstream
    // service calling check-permission would bypass all ABAC rules.
    private contextEvaluator: ContextEvaluatorService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() body: { email: string; name: string; password: string; department?: string }) {
    this.logger.log(`Register attempt for email: ${body.email}`);

    const existing = await this.userModel.findOne({ email: body.email });
    if (existing) {
      throw new UnauthorizedException('Email already registered');
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

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);

    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) {
      this.logger.warn(`Login failed — email not found: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed — account deactivated: ${dto.email}`);
      throw new UnauthorizedException('Account is deactivated');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      this.logger.warn(`Login failed — wrong password for: ${dto.email}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // We include department and mfaVerified in the token so the
    // PermissionsGuard can build a full PermissionContext without
    // an extra DB call on every request.
    //
    // Trade-off: if mfaVerified changes mid-session, the old value
    // stays in the token until expiry. Acceptable because tokens are
    // short-lived. If you need immediate revocation, use /auth/check-permission
    // (which hits the live DB) instead of relying solely on the token.
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

  /*
    GET /auth/me
    Returns the current user's identity and context fields from the token.

    Used by:
      - The frontend dashboard on load (to show name, role context, department)
      - Downstream resource services that need to verify token validity
        without knowing the JWT secret — they forward the Bearer token here
        and get back a verified user object.

    Why we return department and mfaVerified:
      The PAM dashboard needs to display these to admins managing users.
      Downstream services need mfaVerified to decide whether to prompt
      for MFA before allowing a sensitive operation.
  */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: any) {
    this.logger.log(`/auth/me called for user: ${req.user.email}`);
    return {
      userId: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      department: req.user.department ?? null,
      mfaVerified: req.user.mfaVerified ?? false,
    };
  }

  /*
    POST /auth/check-permission
    Full permission check including ABAC context evaluation.

    This is the delegation endpoint for downstream services in the PAM system.
    A resource service (e.g. the service that manages what resources exist)
    calls this on every protected operation instead of implementing its own
    permission logic. Role changes in the RBAC admin take effect immediately.

    Body:
      permission   — the permission string to check, e.g. 'access:approve'
      context      — forwarded context from the original request. Required
                     for ABAC rules to evaluate correctly.

    Why context must be forwarded by the caller:
      When resource-service calls this endpoint, req.ip is resource-service's
      IP, not the original user's IP. The same applies to user-agent and
      session metadata. The calling service must forward these from the
      original incoming request, otherwise TRUSTED_IP and MAX_SESSION_AGE
      rules would always evaluate against the wrong values.

    Returns:
      granted        — final decision after both role check and ABAC rules
      reason         — human-readable explanation of the decision
      evaluatedRules — which ABAC rules ran and whether they passed
  */
  @Post('check-permission')
  @UseGuards(JwtAuthGuard)
  async checkPermission(
    @Request() req: any,
    @Body() body: {
      permission: string;
      context?: {
        ipAddress?: string;
        userAgent?: string;
        resourceId?: string;
        resourceType?: string;
        resourceDepartment?: string;
        resourceOwnerId?: string;
      };
    },
  ) {
    this.logger.log(`Permission check: ${req.user.email} -> ${body.permission}`);

    // Step 1: Does the user have this permission in their roles at all?
    const hasBasicPermission = await this.userRolesService.hasPermission(
      req.user.userId,
      body.permission,
    );

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

    // Step 2: Run ABAC context rules.
    // We build the PermissionContext from the forwarded context values,
    // falling back to the token values where context wasn't forwarded.
    const permissionContext: PermissionContext = {
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
      sessionAge: calculateSessionAge(req.user.loginTime),
      deviceTrusted: false,
    };

    const decision = this.contextEvaluator.evaluatePermission(
      body.permission,
      permissionContext,
    );

    this.logger.log(
      `check-permission result: ${body.permission} -> ${decision.granted ? 'GRANTED' : 'DENIED'} — ${decision.reason}`,
    );

    return {
      granted: decision.granted,
      reason: decision.reason,
      evaluatedRules: decision.evaluatedRules,
      userId: req.user.userId,
      permission: body.permission,
    };
  }
}