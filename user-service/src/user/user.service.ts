import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MicroResInterface, PatternEnum } from '@samb2/nest-microservice';
import { PageMetaDto } from '../utils/dto/page-meta.dto';
import {
  GetAllUsersResDto,
  GetUserResDto,
  GetUsersQueryDto,
  UpdateUserDto,
  UpdateUserResDto,
} from './dto';
import { PrismaService } from 'nestjs-prisma';
import { MicroserviceService } from '../microservice/microservice.service';

@Injectable()
export class UserService {
  constructor(
    private readonly microserviceService: MicroserviceService,
    private readonly prismaService: PrismaService,
  ) {}

  async findAll(
    getUsersQueryDto?: GetUsersQueryDto,
  ): Promise<GetAllUsersResDto> {
    // Destructure query parameters or set default values if not provided
    const { is_active, admin, is_delete, sort, sortField, take, skip } =
      getUsersQueryDto;

    // Initialize whereConditions object to build the WHERE clause for filtering
    const whereConditions: any = {
      ...(is_delete !== undefined ? { is_delete: JSON.parse(is_delete) } : {}),
      ...(is_active !== undefined ? { is_active: JSON.parse(is_active) } : {}),
      ...(admin !== undefined ? { admin: JSON.parse(admin) } : {}),
    };

    // Determine the sorting order and field
    const orderField: string = sortField || 'created_at';
    const orderDirection: string = sort || 'asc';

    // Retrieve users and total count based on provided criteria
    const users = await this.prismaService.users.findMany({
      where: whereConditions,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        created_at: true,
        auth_id: true,
        avatar: true,
        email: true,
        is_active: true,
        is_delete: true,
        admin: true,
      },
      skip,
      take,
      orderBy: {
        [orderField]: orderDirection,
      },
    });

    const itemCount = await this.prismaService.users.count({
      where: whereConditions,
    });
    // Generate pagination metadata
    const pageMeta: PageMetaDto = new PageMetaDto({
      metaData: getUsersQueryDto,
      itemCount,
    });

    return { users, pageMeta };
  }

  async findOne(id: string): Promise<GetUserResDto> {
    // Find the user by ID
    const user: GetUserResDto = await this.prismaService.users.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        created_at: true,
        avatar: true,
        email: true,
        is_active: true,
        is_delete: true,
        admin: true,
        auth_id: true,
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
    const user = await this.prismaService.users.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        auth_id: true,
        first_name: true,
        last_name: true,
        is_delete: true,
        is_active: true,
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
      authId: user.auth_id,
      updateUserDto: {
        isActive: user.is_active,
        isDelete: user.is_delete,
        admin: user.admin,
      },
    };

    // Send request to the user microservice to update the user in the authentication service
    const result: MicroResInterface =
      await this.microserviceService.sendToAuthService(
        PatternEnum.AUTH_UPDATE_USER,
        payload,
      );

    // If there's an error response from the user microservice, throw an InternalServerErrorException
    if (result.error) {
      throw new InternalServerErrorException(result.reason.message);
    }

    await this.prismaService.users.update({
      where: {
        id: user.id,
      },
      data: {
        ...updateUserDto,
      },
    });

    // Return success message
    return { message: 'The user has been successfully updated.' };
  }

  async validateUserByAuthId(authId: string): Promise<any> {
    return this.prismaService.users.findUnique({
      where: { auth_id: authId, is_delete: false, is_active: true },
    });
  }
}
