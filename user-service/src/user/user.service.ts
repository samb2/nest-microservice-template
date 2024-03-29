import { Injectable, RequestTimeoutException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { RmqContext } from '@nestjs/microservices';
import { UserRepository } from './repository/user.repository';
import { User } from './entities/user.entity';
import {
  generateResMessage,
  ServiceNameEnum,
  expireCheck,
} from '@irole/microservices';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto, context: RmqContext) {
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

  async findAll(): Promise<User[]> {
    return this.userRepository.find({});
  }

  findOne(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: {
        id,
      },
    });
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }

  async validateUserByAuthId(authId: string): Promise<User> {
    return this.userRepository.findOne({
      where: { authId, isDelete: false, isActive: true },
    });
  }
}
