import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { DeleteAvatarDto, UpdateAvatarDto } from './dto';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class ProfileMicroserviceService {
  constructor(
    @Inject(ServiceNameEnum.FILE) private readonly fileClient: ClientProxy,
    @Inject(ServiceNameEnum.AUTH) private readonly authClient: ClientProxy,
    private readonly prismaService: PrismaService,
  ) {}

  async updateAvatar(
    updateAvatarDto: UpdateAvatarDto,
    context: RmqContext,
  ): Promise<MicroResInterface> {
    // Get the channel and original message from the RabbitMQ context
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // Find the user by authId from the repository
      const user = await this.prismaService.users.findUnique({
        where: {
          auth_id: updateAvatarDto.data.authId,
        },
        select: {
          id: true,
          avatar: true,
        },
      });

      // If user is not found, throw NotFoundException
      if (!user) {
        throw new NotFoundException('user not found!');
      }

      // Initialize data object with default values
      let data: object = {
        delete: false,
        avatar: null,
      };

      // If user has an existing avatar, set delete to true and extract avatar path
      if (user.avatar) {
        data = {
          delete: true,
          avatar: user.avatar.replace('avatar/', ''),
        };
      }

      // Update user's avatar with the new avatar path
      await this.prismaService.users.update({
        where: {
          id: user.id,
        },
        data: {
          avatar: updateAvatarDto.data.avatar,
        },
      });

      // Acknowledge the message in the RabbitMQ channel
      channel.ack(originalMsg);

      // Generate response message with success status
      return generateResMessage(
        ServiceNameEnum.USER,
        ServiceNameEnum.FILE,
        data,
        false,
      );
    } catch (e) {
      // If an error occurs, reject the message in the RabbitMQ channel
      await channel.reject(originalMsg, false);

      // Generate response message with error status
      return generateResMessage(
        ServiceNameEnum.USER,
        ServiceNameEnum.FILE,
        null,
        true,
        {
          message: e.message,
          status: e.statusCode | 500,
        },
      );
    }
  }

  async deleteAvatar(
    deleteAvatarDto: DeleteAvatarDto,
    context: RmqContext,
  ): Promise<MicroResInterface> {
    // Get the channel and original message from the RabbitMQ context
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // Find the user by authId from the repository
      const user = await this.prismaService.users.findUnique({
        where: {
          auth_id: deleteAvatarDto.data.authId,
        },
        select: {
          id: true,
          avatar: true,
        },
      });

      // If user is not found, throw NotFoundException
      if (!user) {
        throw new NotFoundException('user not found!');
      }

      // Update the user avatar to null
      await this.prismaService.users.update({
        where: { id: user.id },
        data: { avatar: null },
      });

      // Acknowledge the message in the RabbitMQ channel
      channel.ack(originalMsg);

      // Generate response message with success status
      return generateResMessage(
        ServiceNameEnum.USER,
        ServiceNameEnum.FILE,
        'avatar deleted',
        false,
      );
    } catch (e) {
      // If an error occurs, reject the message in the RabbitMQ channel
      await channel.reject(originalMsg, false);

      // Generate response message with error status
      return generateResMessage(
        ServiceNameEnum.USER,
        ServiceNameEnum.FILE,
        null,
        true,
        {
          message: e.message,
          status: e.statusCode | 500,
        },
      );
    }
  }

  async sendToAuthService(
    pattern: PatternEnum,
    payload: any,
  ): Promise<MicroResInterface> {
    const message: MicroSendInterface = generateMessage(
      ServiceNameEnum.USER,
      ServiceNameEnum.AUTH,
      payload,
    );

    return sendMicroMessage(this.authClient, pattern, message);
  }

  async sendToFileService(
    pattern: PatternEnum,
    payload: any,
  ): Promise<MicroResInterface> {
    const message: MicroSendInterface = generateMessage(
      ServiceNameEnum.USER,
      ServiceNameEnum.FILE,
      payload,
    );

    return sendMicroMessage(this.fileClient, pattern, message);
  }
}
