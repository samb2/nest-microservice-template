import {
  MicroResInterface,
  MicroSendInterface,
  PatternEnum,
  ServiceNameEnum,
  generateMessage,
  generateResMessage,
  sendMicroMessage,
} from '@samb2/nest-microservice';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqContext } from '@nestjs/microservices';
import { IMicroservice } from './interface/IMicroservice.interface';
import { MinioService } from '../minio/minio.service';
import { FileRepository } from '../file/file.repository';
import { BucketEnum } from '../minio/enum/bucket.enum';
import { DeleteAvatarDto } from './dto/delete-avatar.dto';

@Injectable()
export class MicroserviceService implements IMicroservice {
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
    payload: object,
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
    payload: object,
  ): Promise<MicroResInterface> {
    const message: MicroSendInterface = generateMessage(
      ServiceNameEnum.FILE,
      ServiceNameEnum.AUTH,
      payload,
    );

    return sendMicroMessage(this.authClient, pattern, message);
  }
}
