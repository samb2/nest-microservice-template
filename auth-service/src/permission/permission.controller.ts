import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Permission } from './entities/permission.entity';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';
import { PermissionEnum, Permissions } from '@irole/microservices';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_PERMISSION)
  @Get()
  findAll(): Promise<Permission[]> {
    return this.permissionService.findAll();
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_PERMISSION)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<Permission> {
    return this.permissionService.findOne(id);
  }
}
