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
import { BucketEnum } from '../../minio/enum/bucket.enum';

@Injectable()
export class FileMicroserviceService {
  constructor(
    @Inject(ServiceNameEnum.USER) private readonly userClient: ClientProxy,
    @Inject(ServiceNameEnum.AUTH) private readonly authClient: ClientProxy,
    @Inject(MinioService) private readonly minioService: MinioService,
    private readonly fileRepo: FileRepository,
  ) {
    this.userClient.connect().then();
  }

  async deleteAvatar(
    deleteAvatarDto: DeleteAvatarDto,
    context: RmqContext,
  ): Promise<MicroResInterface> {
    // Get the channel and original message from the RabbitMQ context
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      // Remove the avatar file from Minio storage
      await this.minioService.removeObject(
        BucketEnum.AVATAR,
        deleteAvatarDto.data.avatar,
      );

      // Find and delete the avatar file metadata from the database
      await this.fileRepo.findOneAndDelete({
        key: deleteAvatarDto.data.avatar,
      });

      // Acknowledge the message in the RabbitMQ channel
      channel.ack(originalMsg);

      // Return success response message
      return generateResMessage(
        ServiceNameEnum.FILE,
        ServiceNameEnum.USER,
        'avatar deleted',
        false,
      );
    } catch (e) {
      // If an error occurs, reject the message in the RabbitMQ channel
      await channel.reject(originalMsg, false);

      // Return error response message
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
      ServiceNameEnum.FILE,
      ServiceNameEnum.USER,
      payload,
    );

    return sendMicroMessage(this.userClient, pattern, message);
  }

  async sendToAuthService(
    pattern: PatternEnum,
    payload: any,
  ): Promise<MicroResInterface> {
    const message: MicroSendInterface = generateMessage(
      ServiceNameEnum.FILE,
      ServiceNameEnum.AUTH,
      payload,
    );

    return sendMicroMessage(this.authClient, pattern, message);
  }
}
