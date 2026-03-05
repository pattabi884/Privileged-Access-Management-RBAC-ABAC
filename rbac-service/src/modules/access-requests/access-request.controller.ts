import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  Query,
} from '@nestjs/common';
import { AccessRequestService, CreateAccessRequestDto, ReviewAccessRequestDto } from './access-requests.service';
import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { AccessRequestStatus } from '@infrastructure/database/schemas/access-request.schema';
import { getClientIp } from '@common/utils/auth.utils';



@Controller('access-requests')
export class AccessRequestsController {
  constructor(private readonly accessRequestService: AccessRequestService) {}

  
  @Post()
  @RequirePermissions('access:request')
  create(
    @Body() body: CreateAccessRequestDto,
    @Request() req: any,
  ) {
    return this.accessRequestService.create(
      body,
      { userId: req.user.userId, email: req.user.email },
      { ip: getClientIp(req), userAgent: req.headers['user-agent'] ?? 'unknown' },
    );
  }

  @Get()
  @RequirePermissions('access:read')
  findAll(@Query('status') status?: AccessRequestStatus) {
    return this.accessRequestService.findAll(status);
  }


  // IMPORTANT: this route must be declared BEFORE /:id below.
  // Express matches routes top-to-bottom — if /:id comes first,
  // the string 'mine' would be treated as an ID and the DB query would fail.
  @Get('mine')
  @RequirePermissions('access:request')
  findMine(@Request() req: any) {
    return this.accessRequestService.findMine(req.user.userId);
  }

  
  @Get(':id')
  @RequirePermissions('access:read')
  findOne(@Param('id') id: string) {
    return this.accessRequestService.findOne(id);
  }


  @Patch(':id/approve')
  @RequirePermissions('access:approve')
  approve(
    @Param('id') id: string,
    @Body() body: ReviewAccessRequestDto,
    @Request() req: any,
  ) {
    return this.accessRequestService.approve(
      id,
      { userId: req.user.userId, email: req.user.email },
      body,
    );
  }

  @Patch(':id/reject')
  @RequirePermissions('access:approve')
  reject(
    @Param('id') id: string,
    @Body() body: ReviewAccessRequestDto,
    @Request() req: any,
  ) {
    return this.accessRequestService.reject(
      id,
      { userId: req.user.userId, email: req.user.email },
      body,
    );
  }

  @Patch(':id/revoke')
  @RequirePermissions('access:revoke')
  revoke(
    @Param('id') id: string,
    @Body() body: ReviewAccessRequestDto,
    @Request() req: any,
  ) {
    return this.accessRequestService.revoke(
      id,
      { userId: req.user.userId, email: req.user.email },
      body,
    );
  }
}