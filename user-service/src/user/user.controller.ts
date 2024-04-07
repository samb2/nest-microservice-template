import {
  Controller,
  Get,
  Param,
  UseGuards,
  Patch,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PermissionEnum } from '@irole/microservices';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { Permissions } from '@irole/microservices';
import { PageMetaDto } from './dto/page-meta.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { ApiOkResponseSuccess } from '../utils/ApiOkResponseSuccess.util';
import { UpdateUserResDto } from './dto/response/update-user-res.dto';
import { GetUserResDto } from './dto/response/get-user-res.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_USER)
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiQuery({ name: 'is_delete', required: false, type: Boolean })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'admin', required: false, type: Boolean })
  findAll(
    @Query() findUsersDto?: FindUsersDto,
  ): Promise<{ users: User[]; pageMeta: PageMetaDto }> {
    return this.userService.findAll(findUsersDto);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_USER)
  @Get(':id')
  @ApiOperation({ summary: 'Get a user info' })
  @ApiOkResponseSuccess(GetUserResDto, 200)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiResponse({ status: 404, description: 'user not found!' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.UPDATE_USER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponseSuccess(UpdateUserResDto, 200)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiResponse({ status: 404, description: 'user not found!' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResDto> {
    return this.userService.update(id, updateUserDto);
  }
}
