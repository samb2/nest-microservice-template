import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from './entities';
import { IUserServiceInterface } from './interfaces/IUserService.interface';
import { bcryptPassword, comparePassword } from '../utils/password.util';
import { PayloadInfo } from '../microservice/dto';

@Injectable()
export class UserService implements IUserServiceInterface {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  public async validateUserByAuthId(id: string): Promise<User | undefined> {
    try {
      return this.userRepository.findOne({
        where: { id, isDelete: false, isActive: true },
        select: {
          id: true,
          superAdmin: true,
          isActive: true,
          email: true,
          isDelete: true,
          createdAt: true,
        },
      });
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  public async updateUser(
    id: string,
    data: Partial<User>,
  ): Promise<UpdateResult> {
    return this.userRepository.update(
      {
        id,
      },
      {
        ...data,
      },
    );
  }

  public async updatePassword(id: string, data: PayloadInfo) {
    // Find the user by ID and select the password field
    const user: User = await this.userRepository.findOne({
      where: { id },
      select: { id: true, password: true },
    });

    // Compare the old password with the stored password
    const compare: boolean = await comparePassword(
      data.oldPassword,
      user.password,
    );

    // If old password is incorrect, throw an error
    if (!compare) {
      throw new Error('Your old password is incorrect');
    }

    // Hash and update the new password
    user.password = await bcryptPassword(data.newPassword);

    // Save the updated user entity
    await this.userRepository.save(user);
  }
}
