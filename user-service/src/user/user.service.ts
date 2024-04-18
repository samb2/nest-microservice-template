import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserResDto } from './dto/response/update-user-res.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMicroserviceService } from './microservice/user-microservice.service';
import { GetUserResDto } from './dto/response/get-user-res.dto';
import { GetAllUsersResDto } from './dto/response/get-all-users-res.dto';
import { PageMetaDto } from '../utils/dto/page-meta.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userMicroserviceService: UserMicroserviceService,
  ) {}

  async findAll(findUsersDto?: FindUsersQueryDto): Promise<GetAllUsersResDto> {
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
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        authId: true,
        avatar: true,
        email: true,
        isActive: true,
        isDelete: true,
        admin: true,
      },
      skip,
      take,
      order: {
        [orderField]: orderDirection,
      },
    });

    const pageMeta = new PageMetaDto({
      metaData: findUsersDto,
      itemCount,
    });

    return { users, pageMeta };
  }

  async findOne(id: string): Promise<GetUserResDto> {
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
        authId: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResDto> {
    const user: User = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found!');
    }
    Object.assign(user, updateUserDto);
    //---------------------------------------

    const payload = {
      authId: user.authId,
      updateUserDto,
    };

    const result: MicroResInterface =
      await this.userMicroserviceService.sendToAuthService(
        PatternEnum.AUTH_UPDATE_USER,
        payload,
      );

    if (result.error) {
      throw new InternalServerErrorException(result.reason.message);
    }

    await this.userRepository.save(user);
    return { message: 'The user has been successfully updated.' };
  }

  async validateUserByAuthId(authId: string): Promise<User> {
    return this.userRepository.findOne({
      where: { authId, isDelete: false, isActive: true },
    });
  }
}
