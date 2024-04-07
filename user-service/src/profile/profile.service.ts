import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../user/entities/user.entity';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileMicroserviceService } from './microservice/profile-microservice.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly profileMicroserviceService: ProfileMicroserviceService,
  ) {}

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

  async updatePassword(
    updateProfileDto: UpdatePasswordDto,
    user: User,
  ): Promise<string> {
    // send to auth service
    const payload = {
      ...updateProfileDto,
      authId: user.authId,
    };

    const result: MicroResInterface =
      await this.profileMicroserviceService.sendToAuthService(
        PatternEnum.AUTH_UPDATE_PASSWORD,
        payload,
      );
    if (result.error) {
      throw new InternalServerErrorException(result.reason.message);
    }
    return `profile password update successfully`;
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

      const result: MicroResInterface =
        await this.profileMicroserviceService.sendToFileService(
          PatternEnum.USER_AVATAR_DELETED,
          payload,
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
