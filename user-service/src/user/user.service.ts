import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RmqContext } from '@nestjs/microservices';
import { UserRepository } from './repository/user.repository';
import { MicroserviceMessageUtil } from '../common/utils/microservice-message.util';
import { ServiceNameEnum } from '../common/enum/service-name.enum';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto, context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const user = this.userRepository.create({
        email: createUserDto.data.email,
        authId: createUserDto.data.authId,
      });

      await this.userRepository.save(user);
      channel.ack(originalMsg);
      return MicroserviceMessageUtil.generateResMessage(
        ServiceNameEnum.AUTH,
        'user created',
        false,
      );
    } catch (e) {
      await channel.reject(originalMsg, false);
      return MicroserviceMessageUtil.generateResMessage(
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

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
