import {
  Injectable,
  NotFoundException,
  RequestTimeoutException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { PageMetaDto } from './dto/page-meta.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserResDto } from './dto/response/update-user-res.dto';

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

  async findAll(
    findUsersDto?: FindUsersDto,
  ): Promise<{ users: User[]; pageMeta: PageMetaDto }> {
    const { is_active, admin, is_delete, sort, sortField, take, skip } =
      findUsersDto;
    const whereConditions: any = {};

    if (is_delete !== undefined) {
      whereConditions.isDelete = is_delete;
    }
    if (is_active !== undefined) {
      whereConditions.isActive = is_active;
    }
    if (admin !== undefined) {
      whereConditions.admin = admin;
    }

    const orderField: string = sortField || 'createdAt';
    const orderDirection: string = sort || 'ASC';

    const [users, itemCount] = await this.userRepository.findAndCount({
      where: whereConditions,
      skip,
      take,
      order: {
        [orderField]: orderDirection,
      },
    });

    const pageMeta = new PageMetaDto({
      findUsersDto,
      itemCount,
    });

    return { users, pageMeta };
  }

  async findOne(id: string): Promise<User> {
    const user: User = await this.userRepository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        avatar: true,
        email: true,
        isActive: true,
        isDelete: true,
        admin: true,
      },
    });
    if (!user) {
      throw new NotFoundException('user not found!');
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
    isSuperAdmin: boolean,
  ): Promise<UpdateUserResDto> {
    const user: User = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException('user not found!');
    }

    if (updateUserDto.superAdmin && !isSuperAdmin) {
      delete updateUserDto.superAdmin;
      throw new UnauthorizedException();
    }
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);
    return { message: 'The user has been successfully updated.' };
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
