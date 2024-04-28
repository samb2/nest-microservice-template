import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';
import * as process from 'node:process';
import {
  DeleteAvatarResDto,
  UpdatePasswordDto,
  UpdatePasswordResDto,
  UpdateProfileDto,
  UpdateProfileResDto,
} from './dto';
import { PrismaService } from 'nestjs-prisma';
import { MicroserviceService } from '../microservice/microservice.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly microserviceService: MicroserviceService,
    private readonly prismaService: PrismaService,
  ) {}

  async findOne(user: User): Promise<any> {
    return {
      id: user.id,
      email: user.email,
      authId: user.auth_id,
      avatar: user.avatar
        ? `${process.env.MINIO_STORAGE_URL}${user.avatar}`
        : null,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
    };
  }

  async update(
    updateProfileDto: UpdateProfileDto,
    user: User,
  ): Promise<UpdateProfileResDto> {
    // Destructure the fields from the DTO
    let { first_name, last_name } = updateProfileDto;

    // If firstName or lastName is not provided in the DTO, use the existing values from the user entity
    first_name = first_name ? first_name : user.first_name;
    last_name = last_name ? last_name : user.last_name;

    // Update the user's profile in the database
    await this.prismaService.users.update({
      where: { id: user.id },
      data: {
        first_name,
        last_name,
      },
    });

    // Return a success message
    return { message: `profile update successfully` };
  }

  async updatePassword(
    updateProfileDto: UpdatePasswordDto,
    user: User,
  ): Promise<UpdatePasswordResDto> {
    // Construct payload with user's authentication ID
    const payload = {
      ...updateProfileDto,
      authId: user.auth_id,
    };

    // Send password update request to the authentication service
    const result: MicroResInterface =
      await this.microserviceService.sendToAuthService(
        PatternEnum.AUTH_UPDATE_PASSWORD,
        payload,
      );

    // If there's an error response from the authentication service, throw an InternalServerErrorException
    if (result.error) {
      throw new InternalServerErrorException(result.reason.message);
    }

    // Return success message
    return { message: `Password update successfully` };
  }

  async deleteAvatar(id: string, avatar: string): Promise<DeleteAvatarResDto> {
    try {
      // If the avatar path is not provided, throw NotFoundException
      if (!avatar) {
        throw new NotFoundException('avatar not found');
      }

      // Update the user's avatar to null in the database
      const updateUser = this.prismaService.users.update({
        where: { id },
        data: { avatar: null },
      });
      //await userRep.update({ id }, { avatar: null });

      // send to file service
      const payload = {
        avatar: avatar.replace(`avatar/`, ''),
      };

      // Send a request to the file service to delete the avatar file
      const result: MicroResInterface =
        await this.microserviceService.sendToFileService(
          PatternEnum.FILE_AVATAR_DELETED,
          payload,
        );

      // If there's an error response from the file service, throw an InternalServerErrorException
      if (result.error) {
        throw new InternalServerErrorException(result.reason.message);
      }

      // Commit the transaction
      await this.prismaService.$transaction([updateUser]);

      // Return success message
      return { message: 'Avatar deleted successfully' };
    } catch (e) {
      // Rollback the transaction in case of an error
      throw e;
    }
  }
}
