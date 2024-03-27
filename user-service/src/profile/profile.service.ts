import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ClientProxy, RmqContext } from '@nestjs/microservices';
import { User } from '../user/entities/user.entity';
import {
  generateMessage,
  generateResMessage,
  MicroResInterface,
  MicroSendInterface,
  PatternEnum,
  sendMicroMessage,
  ServiceNameEnum,
} from '@irole/microservices';
import { UserRepository } from '../user/repository/user.repository';
import { DeleteAvatarDto } from './dto/delete-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(ServiceNameEnum.FILE) private readonly fileClient: ClientProxy,
  ) {}

  async microUpdateAvatar(
    updateAvatarDto: UpdateAvatarDto,
    context: RmqContext,
  ) {
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

  async microDeleteAvatar(
    deleteAvatarDto: DeleteAvatarDto,
    context: RmqContext,
  ) {
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

  async findOne(id: string): Promise<User> {
    return await this.userRepository.findOne({
      where: { id },
      select: {
        id: true,
        authId: true,
        avatar: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });
  }

  async update(
    updateProfileDto: UpdateProfileDto,
    user: User,
  ): Promise<string> {
    let { firstName, lastName } = updateProfileDto;

    firstName = firstName ? firstName : user.firstName;
    lastName = lastName ? lastName : user.lastName;

    await this.userRepository.update(
      { id: user.id },
      {
        firstName,
        lastName,
      },
    );
    return `profile update successfully`;
  }

  async deleteAvatar(id: string, avatar: string) {
    try {
      if (!avatar) {
        throw new NotFoundException('avatar not found');
      }
      await this.userRepository.update({ id }, { avatar: null });

      // send to file service
      const payload = {
        avatar: avatar.replace(`avatar/`, ''),
      };

      const message: MicroSendInterface = generateMessage(
        ServiceNameEnum.USER,
        ServiceNameEnum.FILE,
        payload,
      );

      const result: MicroResInterface = await sendMicroMessage(
        this.fileClient,
        PatternEnum.USER_AVATAR_DELETED,
        message,
      );
      if (result.error) {
        throw new InternalServerErrorException(result.reason.message);
      }
      return 'Profile Avatar delete successfully!';
    } catch (e) {
      throw e;
    }
  }
}
