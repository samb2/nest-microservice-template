import { Controller } from '@nestjs/common';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { FileMicroserviceService } from './file-microservice.service';
import { DeleteAvatarDto } from './dto/delete-avatar.dto';

@Controller()
export class FileMicroserviceController {
  constructor(
    private readonly fileMicroserviceService: FileMicroserviceService,
  ) {}

  @MessagePattern(PatternEnum.FILE_AVATAR_DELETED)
  microDeleteAvatar(
    @Payload() deleteAvatarDto: DeleteAvatarDto,
    @Ctx() context: RmqContext,
  ): Promise<MicroResInterface> {
    return this.fileMicroserviceService.deleteAvatar(deleteAvatarDto, context);
  }
}
