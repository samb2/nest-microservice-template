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
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PermissionEnum } from '@samb2/nest-microservice';
import { Permissions } from '@samb2/nest-microservice';
import { ApiOkResponseSuccess } from '../utils/ApiOkResponseSuccess.util';
import { AccessTokenGuard, PermissionGuard } from '../utils/guard';
import {
  FindUsersQueryDto,
  GetAllUsersResDto,
  GetUserResDto,
  UpdateUserDto,
  UpdateUserResDto,
} from './dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_USER)
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiOkResponseSuccess(GetAllUsersResDto)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiQuery({ name: 'is_delete', required: false, type: Boolean })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'admin', required: false, type: Boolean })
  findAll(
    @Query() findUsersDto?: FindUsersQueryDto,
  ): Promise<GetAllUsersResDto> {
    return this.userService.findAll(findUsersDto);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_USER)
  @Get(':id')
  @ApiOperation({ summary: 'Get a user info' })
  @ApiOkResponseSuccess(GetUserResDto)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found!' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<GetUserResDto> {
    return this.userService.findOne(id);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.UPDATE_USER)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponseSuccess(UpdateUserResDto)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiNotFoundResponse({ description: 'User not found!' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResDto> {
    return this.userService.update(id, updateUserDto);
  }
}
