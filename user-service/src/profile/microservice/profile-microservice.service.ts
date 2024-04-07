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
import { DeleteAvatarDto } from './dto/delete-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../user/entities/user.entity';

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
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const user: User = await this.userRepository.findOne({
        where: {
          authId: updateAvatarDto.data.authId,
        },
      });
      if (!user) {
        throw new NotFoundException('user not found!');
      }
      let data: object = {
        delete: false,
        avatar: null,
      };
      if (user.avatar) {
        data = {
          delete: true,
          avatar: user.avatar.replace('avatar/', ''),
        };
      }
      user.avatar = updateAvatarDto.data.avatar;
      await this.userRepository.save(user);
      channel.ack(originalMsg);
      return generateResMessage(
        ServiceNameEnum.USER,
        ServiceNameEnum.FILE,
        data,
        false,
      );
    } catch (e) {
      await channel.reject(originalMsg, false);
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
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const user: User = await this.userRepository.findOne({
        where: {
          authId: deleteAvatarDto.data.authId,
        },
      });
      if (!user) {
        throw new NotFoundException('user not found!');
      }

      user.avatar = null;
      await this.userRepository.save(user);
      channel.ack(originalMsg);
      return generateResMessage(
        ServiceNameEnum.USER,
        ServiceNameEnum.FILE,
        'avatar deleted',
        false,
      );
    } catch (e) {
      await channel.reject(originalMsg, false);
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
