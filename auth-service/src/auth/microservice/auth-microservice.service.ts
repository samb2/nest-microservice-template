import { Inject, Injectable, NotFoundException } from '@nestjs/common';
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
      where: { id, isDelete: false, isActive: true },
      select: {
        id: true,
        superAdmin: true,
        isActive: true,
        email: true,
        isDelete: true,
        createdAt: true,
      },
    });
  }

  public async verifyToken(
    payload: MicroResInterface,
    context: RmqContext,
  ): Promise<MicroResInterface> {
    // Get the channel and original message from the RabbitMQ context
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      // Validate user by authId from the payload
      const user: User = await this.validateUserByAuthId(payload.data.authId);

      // If user is not found, throw NotFoundException
      if (!user) {
        throw new NotFoundException('User Not Found');
      }
      // Acknowledge the message in the RabbitMQ channel
      channel.ack(originalMsg);

      // Return response message with user information
      return generateResMessage(payload.from, payload.to, user, false);
    } catch (e) {
      // If an error occurs, reject the message in the RabbitMQ channel
      await channel.reject(originalMsg, false);

      // Return error response message
      return generateResMessage(payload.from, payload.to, null, true, {
        message: e.message,
        status: 500,
      });
    }
  }

  async updateUser(
    updateUserDto: UpdateUserDto,
    context: RmqContext,
  ): Promise<MicroResInterface> {
    // Get the channel and original message from the RabbitMQ context
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      // Update the user in the database using the provided data
      await this.userRepository.update(
        {
          id: updateUserDto.data.authId,
        },
        {
          ...updateUserDto.data.updateUserDto,
        },
      );
      // Acknowledge the message in the RabbitMQ channel
      channel.ack(originalMsg);

      // Return success response message
      return generateResMessage(
        ServiceNameEnum.AUTH,
        ServiceNameEnum.USER,
        'user updated',
        false,
      );
    } catch (e) {
      // If an error occurs, reject the message in the RabbitMQ channel
      await channel.reject(originalMsg, false);

      // Return error response message
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
  ): Promise<MicroResInterface> {
    // Get the channel and original message from the RabbitMQ context
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      // Find the user by ID and select the password field
      const user: User = await this.userRepository.findOne({
        where: { id: updateUserPasswordDto.data.authId },
        select: { id: true, password: true },
      });

      // Compare the old password with the stored password
      const compare: boolean = await comparePassword(
        updateUserPasswordDto.data.oldPassword,
        user.password,
      );

      // If old password is incorrect, throw an error
      if (!compare) {
        throw new Error('Your old password is incorrect');
      }

      // Hash and update the new password
      user.password = await bcryptPassword(
        updateUserPasswordDto.data.newPassword,
      );

      // Save the updated user entity
      await this.userRepository.save(user);

      // Acknowledge the message in the RabbitMQ channel
      channel.ack(originalMsg);

      // Return success response message
      return generateResMessage(
        ServiceNameEnum.AUTH,
        ServiceNameEnum.USER,
        'user password updated',
        false,
      );
    } catch (e) {
      // If an error occurs, reject the message in the RabbitMQ channel
      await channel.reject(originalMsg, false);

      // Return error response message
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
