import { Inject, Injectable, RequestTimeoutException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { ClientProxy, RmqContext } from '@nestjs/microservices';
import {
  generateResMessage,
  ServiceNameEnum,
  expireCheck,
  MicroSendInterface,
  generateMessage,
  MicroResInterface,
  sendMicroMessage,
  PatternEnum,
} from '@irole/microservices';
import { prisma } from '../../prisma';

@Injectable()
export class UserMicroserviceService {
  constructor(
    @Inject(ServiceNameEnum.AUTH) private readonly authClient: ClientProxy,
  ) {}

  async create(
    createUserDto: CreateUserDto,
    context: RmqContext,
  ): Promise<MicroResInterface> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      if (!expireCheck(createUserDto.ttl)) {
        throw new RequestTimeoutException('Token Expired');
      }

      await prisma.users.create({
        data: {
          email: createUserDto.data.email,
          auth_id: createUserDto.data.authId,
        },
      });

      channel.ack(originalMsg);
      return generateResMessage(
        ServiceNameEnum.USER,
        ServiceNameEnum.AUTH,
        'user created',
        false,
      );
    } catch (e) {
      await channel.reject(originalMsg, false);
      return generateResMessage(
        ServiceNameEnum.USER,
        ServiceNameEnum.AUTH,
        null,
        true,
        {
          message: e.message,
          status: e.statusCode | 500,
        },
      );
    }
  }

  public async sendToAuthService(
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
}
