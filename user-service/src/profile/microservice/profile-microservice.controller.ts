import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { ProfileMicroserviceService } from './profile-microservice.service';
import { DeleteAvatarDto, UpdateAvatarDto } from './dto';

@Controller()
export class ProfileMicroserviceController {
  constructor(
    private readonly profileMicroserviceService: ProfileMicroserviceService,
  ) {}

  @MessagePattern(PatternEnum.USER_AVATAR_UPLOADED)
  updateAvatar(
    @Payload() updateAvatarDto: UpdateAvatarDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.profileMicroserviceService.updateAvatar(
      updateAvatarDto,
      context,
    );
  }

  @MessagePattern(PatternEnum.USER_AVATAR_DELETED)
  microDeleteAvatar(
    @Payload() deleteAvatarDto: DeleteAvatarDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.profileMicroserviceService.deleteAvatar(
      deleteAvatarDto,
      context,
    );
  }
}
