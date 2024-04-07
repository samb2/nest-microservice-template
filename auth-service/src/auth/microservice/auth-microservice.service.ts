import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ClientProxy, RmqContext } from '@nestjs/microservices';
import {
  generateMessage,
  generateResMessage,
  MicroResInterface,
  MicroSendInterface,
  PatternEnum,
  sendMicroMessageWithTimeOut,
  ServiceNameEnum,
} from '@irole/microservices';
import { User } from '../entities/user.entity';
import { bcryptPassword, comparePassword } from '../../utils/password.util';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';

@Injectable()
export class AuthMicroserviceService {
  constructor(
    @Inject(ServiceNameEnum.USER) private readonly userClient: ClientProxy,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.userClient.connect().then();
  }

  public async sendToUserService(
    pattern: PatternEnum,
    payload: any,
    timeOut: string | number,
  ): Promise<MicroResInterface> {
    const message: MicroSendInterface = generateMessage(
      ServiceNameEnum.AUTH,
      ServiceNameEnum.USER,
      payload,
      timeOut,
    );
    return sendMicroMessageWithTimeOut(
      this.userClient,
      pattern,
      message,
      timeOut,
    );
  }

  public async validateUserByAuthId(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id, isDelete: false },
    });
  }

  public async verifyToken(
    payload: MicroResInterface,
    context: RmqContext,
  ): Promise<MicroResInterface> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const user: User = await this.validateUserByAuthId(payload.data.authId);
      if (!user) {
        return generateResMessage(payload.from, payload.to, null, true, {
          message: 'User Not Found',
          status: 404,
        });
      }
      channel.ack(originalMsg);
      return generateResMessage(payload.from, payload.to, user, false);
    } catch (e) {
      await channel.reject(originalMsg, false);
      return generateResMessage(payload.from, payload.to, null, true, {
        message: e.message,
        status: 500,
      });
    }
  }

  async updateUser(updateUserDto: UpdateUserDto, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.userRepository.update(
        {
          id: updateUserDto.data.authId,
        },
        {
          ...updateUserDto.data.updateUserDto,
        },
      );
      channel.ack(originalMsg);
      return generateResMessage(
        ServiceNameEnum.AUTH,
        ServiceNameEnum.USER,
        'user updated',
        false,
      );
    } catch (e) {
      await channel.reject(originalMsg, false);
      return generateResMessage(
        ServiceNameEnum.AUTH,
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

  async updatePassword(
    updateUserPasswordDto: UpdateUserPasswordDto,
    context: RmqContext,
  ) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const user: User = await this.userRepository.findOne({
        where: { id: updateUserPasswordDto.data.authId },
      });

      const compare: boolean = await comparePassword(
        updateUserPasswordDto.data.oldPassword,
        user.password,
      );
      if (!compare) {
        throw new Error('your old password is incorrect');
      }

      user.password = await bcryptPassword(
        updateUserPasswordDto.data.newPassword,
      );
      await this.userRepository.save(user);
      channel.ack(originalMsg);
      return generateResMessage(
        ServiceNameEnum.AUTH,
        ServiceNameEnum.USER,
        'user password updated',
        false,
      );
    } catch (e) {
      await channel.reject(originalMsg, false);
      return generateResMessage(
        ServiceNameEnum.AUTH,
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
}
