import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permission } from './entities/permission.entity';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';
import { PermissionEnum, Permissions } from '@irole/microservices';
import { ApiOkResponseSuccess } from '../utils/ApiOkResponseSuccess.util';
import { GetPermissionRes } from './dto/response/get-permissions-res.dto';
import { GetPermissionDto } from './dto/get-permission.dto';
import { PageMetaDto } from '../utils/page-meta.dto';

@ApiTags('permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_PERMISSION)
  @Get()
  @ApiOperation({ summary: 'Get all permissions' })
  @ApiOkResponseSuccess(GetPermissionRes, 200, true)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  findAll(
    @Query() getPermissionDto?: GetPermissionDto,
  ): Promise<{ permissions: Permission[]; pageMeta: PageMetaDto }> {
    return this.permissionService.findAll(getPermissionDto);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_PERMISSION)
  @Get(':id')
  @ApiOperation({ summary: 'Get a permission' })
  @ApiOkResponseSuccess(GetPermissionRes)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiNotFoundResponse({ description: 'Permission not found!' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Permission> {
    return this.permissionService.findOne(id);
  }
}
