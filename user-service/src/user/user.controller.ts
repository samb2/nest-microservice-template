import {
  Controller,
  Get,
  Param,
  Delete,
  UseGuards,
  Patch,
  Body,
  Query,
  UsePipes,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  MicroResInterface,
  PatternEnum,
  PermissionEnum,
  UuidValidationPipe,
} from '@irole/microservices';
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

@ApiTags('user')
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(PatternEnum.USER_REGISTERED)
  createUser(
    @Payload() createUserDto: CreateUserDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.userService.create(createUserDto, context);
  }

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
  @UsePipes(new UuidValidationPipe())
  findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.UPDATE_USER)
  @Patch(':id')
  @UsePipes(new UuidValidationPipe())
  @ApiOperation({ summary: 'Update a user' })
  @ApiOkResponseSuccess(UpdateUserResDto, 200)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiResponse({ status: 404, description: 'user not found!' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: any,
  ): Promise<UpdateUserResDto> {
    return this.userService.update(id, updateUserDto, req.user.superAdmin);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.DELETE_USER)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @UsePipes(new UuidValidationPipe())
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
