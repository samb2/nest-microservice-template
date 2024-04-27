import { Controller } from '@nestjs/common';
import { MicroserviceService } from './microservice.service';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { DeleteAvatarDto } from './dto/delete-avatar.dto';

@Controller()
export class MicroserviceController {
  constructor(private readonly microserviceService: MicroserviceService) {}

  @MessagePattern(PatternEnum.FILE_AVATAR_DELETED)
  microDeleteAvatar(
    @Payload() deleteAvatarDto: DeleteAvatarDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.microserviceService.deleteAvatar(deleteAvatarDto, context);
  }
}
