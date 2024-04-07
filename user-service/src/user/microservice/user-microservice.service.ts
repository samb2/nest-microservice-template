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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UserMicroserviceService {
  constructor(
    @Inject(ServiceNameEnum.AUTH) private readonly authClient: ClientProxy,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      const user = this.userRepository.create({
        email: createUserDto.data.email,
        authId: createUserDto.data.authId,
      });

      await this.userRepository.save(user);
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
