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
    // Destructure query parameters or set default values if not provided
    const { is_active, admin, is_delete, sort, sortField, take, skip } =
      findUsersDto;

    // Initialize whereConditions object to build the WHERE clause for filtering
    const whereConditions: any = {
      ...(is_delete !== undefined ? { isDelete: is_delete } : {}),
      ...(is_active !== undefined ? { isActive: is_active } : {}),
      ...(admin !== undefined ? { admin: admin } : {}),
    };

    // Determine the sorting order and field
    const orderField: string = sortField || 'createdAt';
    const orderDirection: string = sort || 'ASC';

    // Retrieve users and total count based on provided criteria
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

    // Generate pagination metadata
    const pageMeta: PageMetaDto = new PageMetaDto({
      metaData: findUsersDto,
      itemCount,
    });

    return { users, pageMeta };
  }

  async findOne(id: string): Promise<GetUserResDto> {
    // Find the user by ID
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

    // If user is not found, throw NotFoundException
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    // Return the retrieved user
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UpdateUserResDto> {
    // Find the user by ID
    const user: User = await this.userRepository.findOne({
      where: {
        id,
      },
      select: {
        id: true,
        authId: true,
        firstName: true,
        lastName: true,
        isDelete: true,
        isActive: true,
        admin: true,
      },
    });

    // If user is not found, throw NotFoundException
    if (!user) {
      throw new NotFoundException('User not found!');
    }

    // Update user properties with the values from the DTO
    Object.assign(user, updateUserDto);

    // Prepare payload for updating user in the authentication service
    const payload = {
      authId: user.authId,
      updateUserDto: {
        isActive: user.isActive,
        isDelete: user.isDelete,
        admin: user.admin,
      },
    };

    // Send request to the user microservice to update the user in the authentication service
    const result: MicroResInterface =
      await this.userMicroserviceService.sendToAuthService(
        PatternEnum.AUTH_UPDATE_USER,
        payload,
      );

    // If there's an error response from the user microservice, throw an InternalServerErrorException
    if (result.error) {
      throw new InternalServerErrorException(result.reason.message);
    }

    // Save the updated user entity
    await this.userRepository.save(user);

    // Return success message
    return { message: 'The user has been successfully updated.' };
  }

  async validateUserByAuthId(authId: string): Promise<User> {
    return this.userRepository.findOne({
      where: { authId, isDelete: false, isActive: true },
    });
  }
}
