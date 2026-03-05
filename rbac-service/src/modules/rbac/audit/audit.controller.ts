
import { Controller, Get, Param, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';


@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  // All recent logs — shown in the main audit feed
  @Get('recent')
  @RequirePermissions('audit:read')
  getRecent(
    @Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit: number,
  ) {
    return this.auditService.getRecentLogs(limit);
  }

  // Only suspicious logs — shown in the security alerts section
  @Get('suspicious')
  @RequirePermissions('audit:read')
  getSuspicious(
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.auditService.getSuspiciousActivity(limit);
  }

  @Get('user/:userId')
  @RequirePermissions('audit:read')
  getUserLogs(
    @Param('userId') userId: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.auditService.getUserAuditLogs(userId, limit);
  }
}