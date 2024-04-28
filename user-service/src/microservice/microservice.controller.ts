import { Controller } from '@nestjs/common';
import { MicroserviceService } from './microservice.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';
import { CreateUserDto, DeleteAvatarDto, UpdateAvatarDto } from './dto';

@Controller()
export class MicroserviceController {
  constructor(private readonly microserviceService: MicroserviceService) {}

  @MessagePattern(PatternEnum.USER_AVATAR_UPLOADED)
  updateAvatar(
    @Payload() updateAvatarDto: UpdateAvatarDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.microserviceService.updateAvatar(updateAvatarDto, context);
  }

  @MessagePattern(PatternEnum.USER_AVATAR_DELETED)
  microDeleteAvatar(
    @Payload() deleteAvatarDto: DeleteAvatarDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.microserviceService.deleteAvatar(deleteAvatarDto, context);
  }

  @MessagePattern(PatternEnum.USER_REGISTERED)
  createUser(
    @Payload() createUserDto: CreateUserDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.microserviceService.create(createUserDto, context);
  }
}
