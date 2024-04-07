import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqContext } from '@nestjs/microservices';
import {
  generateMessage,
  generateResMessage,
  MicroResInterface,
  MicroSendInterface,
  PatternEnum,
  sendMicroMessage,
  ServiceNameEnum,
} from '@irole/microservices';
import { DeleteAvatarDto } from './dto/delete-avatar.dto';
import { MinioService } from '../../minio/minio.service';
import { FileRepository } from '../file.repository';
import { BucketEnum } from '../../minio/bucket.enum';

@Injectable()
export class FileMicroserviceService {
  constructor(
    @Inject(ServiceNameEnum.USER) private readonly userClient: ClientProxy,
    @Inject(MinioService) private readonly minioService: MinioService,
    private readonly fileRepo: FileRepository,
  ) {
    this.userClient.connect().then();
  }

  async deleteAvatar(deleteAvatarDto: DeleteAvatarDto, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.minioService.removeObject(
        BucketEnum.AVATAR,
        deleteAvatarDto.data.avatar,
      );
      await this.fileRepo.findOneAndDelete({
        key: deleteAvatarDto.data.avatar,
      });
      channel.ack(originalMsg);
      return generateResMessage(
        ServiceNameEnum.FILE,
        ServiceNameEnum.USER,
        'avatar deleted',
        false,
      );
    } catch (e) {
      await channel.reject(originalMsg, false);
      return generateResMessage(
        ServiceNameEnum.FILE,
        ServiceNameEnum.USER,
        null,
        true,
        {
          message: e.message,
          status: e.statusCode | 500,
        },
      );
    }
  }

  async sendToUserService(
    pattern: PatternEnum,
    payload: any,
  ): Promise<MicroResInterface> {
    const message: MicroSendInterface = generateMessage(
      ServiceNameEnum.USER,
      ServiceNameEnum.FILE,
      payload,
    );

    return sendMicroMessage(this.userClient, pattern, message);
  }
}
