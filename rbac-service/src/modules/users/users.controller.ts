import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Body, 
  Param, 
  UseGuards 
} from '@nestjs/common';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';

import { RequirePermissions } from '@modules/auth/decorators/require-permissions.decorator';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

 @Get()
 @RequirePermissions('users:read')
 findAll() {
  return this.usersService.findAll();
 }
@Get(':id')
@RequirePermissions('users:read')
findOne(@Param('id') id: string) {
  return this.usersService.findOne(id);
  
}

@Patch(':id')
@RequirePermissions('users:update')
update(@Param('id') id: string, @Body() body: {
  name?: string;
  email?: string;
  isActive?: boolean;
  deaprtment?: string;
}){
  return this.usersService.update(id, body);
}

@Delete(':id')
@RequirePermissions('users:delete')
deactivate(@Param('id') id: string){
  return this.usersService.deactivate(id);
}

}