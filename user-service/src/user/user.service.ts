import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User } from './entities/user.entity';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { UpdateUserDto } from './dto/update-user.dto';
import { PageMetaDto } from './dto/page-meta.dto';
import { FindUsersDto } from './dto/find-users.dto';
import { UpdateUserResDto } from './dto/response/update-user-res.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserMicroserviceService } from './microservice/user-microservice.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userMicroserviceService: UserMicroserviceService,
  ) {}

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
  ): Promise<UpdateUserResDto> {
    const user: User = await this.userRepository.findOne({
      where: {
        id,
      },
    });
    if (!user) {
      throw new NotFoundException('user not found!');
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
