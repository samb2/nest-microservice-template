import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RmqContext } from '@nestjs/microservices';
import { User } from '../user/entities/user.entity';
import { generateResMessage, ServiceNameEnum } from '@irole/microservices';
import { UserRepository } from '../user/repository/user.repository';
import { DeleteAvatarDto } from './dto/delete-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly userRepository: UserRepository) {}

  async updateAvatar(updateAvatarDto: UpdateAvatarDto, context: RmqContext) {
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

  async deleteAvatar(deleteAvatarDto: DeleteAvatarDto, context: RmqContext) {
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

  create(createProfileDto: CreateProfileDto) {
    return 'This action adds a new profile';
  }

  findAll() {
    return `This action returns all profile`;
  }

  findOne(id: string) {
    return `This action returns a #${id} profile`;
  }

  update(id: number, updateProfileDto: UpdateProfileDto) {
    return `This action updates a #${id} profile`;
  }

  remove(id: number) {
    return `This action removes a #${id} profile`;
  }
}
