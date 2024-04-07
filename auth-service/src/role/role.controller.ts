import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';
import { PermissionEnum, Permissions } from '@irole/microservices';
import { Role } from './entities/role.entity';
import { User } from '../auth/entities/user.entity';
import { UsersRoles } from '../auth/entities/users-roles.entity';

@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.CREATE_ROLE)
  @Post()
  create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return this.roleService.create(createRoleDto);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_ROLE)
  @Get()
  findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_ROLE)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Role> {
    return this.roleService.findOne(+id);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.UPDATE_ROLE)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ): Promise<Role>  {
    return this.roleService.update(+id, updateRoleDto);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.DELETE_ROLE)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<string> {
    return this.roleService.remove(+id);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_ROLE)
  @Get('/users/:userId')
  getUserRoles(@Param('userId', ParseUUIDPipe) userId: string): Promise<User> {
    return this.roleService.getUserRoles(userId);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.CREATE_ROLE)
  @Post(':id/users/:userId')
  assignRoleToUser(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UsersRoles> {
    return this.roleService.assignRoleToUser(id, userId);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.DELETE_ROLE)
  @Delete(':id/users/:userId')
  deleteUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<string> {
    return this.roleService.deleteUserRole(id, userId);
  }
}
