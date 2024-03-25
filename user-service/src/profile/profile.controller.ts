import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { PatternEnum } from '@irole/microservices';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { DeleteAvatarDto } from './dto/delete-avatar.dto';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @MessagePattern(PatternEnum.USER_AVATAR_UPLOADED)
  updateAvatar(
    @Payload() updateAvatarDto: UpdateAvatarDto,
    @Ctx() context: RmqContext,
  ) {
    return this.profileService.updateAvatar(updateAvatarDto, context);
  }

  @MessagePattern(PatternEnum.USER_AVATAR_DELETED)
  deleteAvatar(
    @Payload() deleteAvatarDto: DeleteAvatarDto,
    @Ctx() context: RmqContext,
  ) {
    return this.profileService.deleteAvatar(deleteAvatarDto, context);
  }

  @Post()
  create(@Body() createProfileDto: CreateProfileDto) {
    return this.profileService.create(createProfileDto);
  }

  @Get()
  findAll() {
    return this.profileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.profileService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProfileDto: UpdateProfileDto) {
    return this.profileService.update(+id, updateProfileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.profileService.remove(+id);
  }
}
