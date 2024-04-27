import {
  MicroResInterface,
  MicroSendInterface,
  PatternEnum,
  ServiceNameEnum,
  generateMessage,
  generateResMessage,
  sendMicroMessageWithTimeOut,
  sendMicroMessage,
} from '@irole/microservices';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RmqContext } from '@nestjs/microservices';
import { User } from '../auth/entities';
import { IMicroservice } from './interface/IMicroservice.interface';
import { UpdateUserDto, UpdateUserPasswordDto } from './dto';
import { UserService } from '../auth/user.service';

@Injectable()
export class MicroserviceService implements IMicroservice {
  constructor(
    @Inject(ServiceNameEnum.USER) private readonly userClient: ClientProxy,
    @Inject(ServiceNameEnum.EMAIL) private readonly emailClient: ClientProxy,
    private readonly userService: UserService,
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

  public async sendToEmailService(
    pattern: PatternEnum,
    payload: any,
    timeOut?: string | number,
  ): Promise<MicroResInterface> {
    const message: MicroSendInterface = generateMessage(
      ServiceNameEnum.AUTH,
      ServiceNameEnum.EMAIL,
      payload,
      timeOut,
    );
    return sendMicroMessage(this.emailClient, pattern, message);
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
      const user: User = await this.userService.validateUserByAuthId(
        payload.data.authId,
      );

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
      await this.userService.updateUser(
        updateUserDto.data.authId,
        updateUserDto.data.updateUserDto,
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
      await this.userService.updatePassword(
        updateUserPasswordDto.data.authId,
        updateUserPasswordDto.data,
      );

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
