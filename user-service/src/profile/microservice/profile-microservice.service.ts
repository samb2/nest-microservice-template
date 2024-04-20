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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { DeleteAvatarDto, UpdateAvatarDto } from './dto';

@Injectable()
export class ProfileMicroserviceService {
  constructor(
    @Inject(ServiceNameEnum.FILE) private readonly fileClient: ClientProxy,
    @Inject(ServiceNameEnum.AUTH) private readonly authClient: ClientProxy,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      const user: User = await this.userRepository.findOne({
        where: {
          authId: updateAvatarDto.data.authId,
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
      user.avatar = updateAvatarDto.data.avatar;

      // Save the updated user entity
      await this.userRepository.save(user);

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
      const user: User = await this.userRepository.findOne({
        where: {
          authId: deleteAvatarDto.data.authId,
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

      // Set user's avatar to null to delete it
      user.avatar = null;

      // Save the updated user entity
      await this.userRepository.save(user);

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
