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
import { UpdateProfileResDto } from './dto/response/update-profile-res.dto';
import { DeleteAvatarResDto } from './dto/response/delete-avatar-res.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly profileMicroserviceService: ProfileMicroserviceService,
  ) {}

  async findOne(user: User): Promise<User> {
    return user;
  }

  async update(
    updateProfileDto: UpdateProfileDto,
    user: User,
  ): Promise<UpdateProfileResDto> {
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
    return { message: `profile update successfully` };
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
    return `Password update successfully`;
  }

  async deleteAvatar(id: string, avatar: string): Promise<DeleteAvatarResDto> {
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
      return { message: 'Avatar deleted successfully' };
    } catch (e) {
      throw e;
    }
  }
}
