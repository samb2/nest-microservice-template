import {
  Controller,
  Get,
  Body,
  Patch,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PermissionEnum, Permissions } from '@irole/microservices';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '../user/entities/user.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_PROFILE)
  @Get()
  findOne(@Req() req: any): Promise<User> {
    return this.profileService.findOne(req.user.id);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.UPDATE_PROFILE)
  @Patch()
  update(
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() req: any,
  ): Promise<string> {
    return this.profileService.update(updateProfileDto, req.user);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.UPDATE_PROFILE)
  @Patch('/password')
  updatePassword(
    @Body() updatePasswordDto: UpdatePasswordDto,
    @Req() req: any,
  ): Promise<string> {
    return this.profileService.updatePassword(updatePasswordDto, req.user);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.DELETE_AVATAR)
  @Delete('/avatar')
  deleteAvatar(@Req() req: any): Promise<string> {
    return this.profileService.deleteAvatar(req.user.id, req.user.avatar);
  }
}
