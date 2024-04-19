import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '../user/entities/user.entity';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { ProfileMicroserviceService } from './microservice/profile-microservice.service';
import { UpdateProfileResDto } from './dto/response/update-profile-res.dto';
import { DeleteAvatarResDto } from './dto/response/delete-avatar-res.dto';
import { UpdatePasswordResDto } from './dto/response/update-password-res.dto';
import { createTransaction } from '../utils/create-transaction.util';
import * as process from 'node:process';

@Injectable()
export class ProfileService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly profileMicroserviceService: ProfileMicroserviceService,
  ) {}

  async findOne(user: User): Promise<User> {
    return {
      id: user.id,
      email: user.email,
      authId: user.authId,
      avatar: user.avatar
        ? `${process.env.MINIO_STORAGE_URL}${user.avatar}`
        : null,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    } as User;
  }

  async update(
    updateProfileDto: UpdateProfileDto,
    user: User,
  ): Promise<UpdateProfileResDto> {
    // Destructure the fields from the DTO
    let { firstName, lastName } = updateProfileDto;

    // If firstName or lastName is not provided in the DTO, use the existing values from the user entity
    firstName = firstName ? firstName : user.firstName;
    lastName = lastName ? lastName : user.lastName;

    // Update the user's profile in the database
    await this.userRepository.update(
      { id: user.id },
      {
        firstName,
        lastName,
      },
    );

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
      authId: user.authId,
    };

    // Send password update request to the authentication service
    const result: MicroResInterface =
      await this.profileMicroserviceService.sendToAuthService(
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
    // Create Transaction
    const queryRunner: QueryRunner = await createTransaction(this.dataSource);

    // Get Repositories
    const userRep: Repository<User> = queryRunner.manager.getRepository(User);

    try {
      // If the avatar path is not provided, throw NotFoundException
      if (!avatar) {
        throw new NotFoundException('avatar not found');
      }

      // Update the user's avatar to null in the database
      await userRep.update({ id }, { avatar: null });

      // send to file service
      const payload = {
        avatar: avatar.replace(`avatar/`, ''),
      };

      // Send a request to the file service to delete the avatar file
      const result: MicroResInterface =
        await this.profileMicroserviceService.sendToFileService(
          PatternEnum.USER_AVATAR_DELETED,
          payload,
        );

      // If there's an error response from the file service, throw an InternalServerErrorException
      if (result.error) {
        throw new InternalServerErrorException(result.reason.message);
      }
      // Commit the transaction
      await queryRunner.commitTransaction();

      // Return success message
      return { message: 'Avatar deleted successfully' };
    } catch (e) {
      // Rollback the transaction in case of an error
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }
}
