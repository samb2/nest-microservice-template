import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { RegisterResDto } from './dto/response/register-res.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResDto } from './dto/response/login-res.dto';
import { bcryptPassword, comparePassword } from '../utils/password.util';
import { ForgotPasswordResDto } from './dto/response/forgot-password-res.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { User } from './entities/user.entity';
import { ResetPassword } from './entities/reset-password.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResetPasswordResDto } from './dto/response/reset-password-res.dto';
import { RefreshResDto } from './dto/response/refresh-res.dto';
import { IAuthServiceInterface } from './interfaces/IAuthService.interface';
import { createTransaction } from '../utils/create-transaction.util';
import {
  JwtAccessPayload,
  JwtRefreshPayload,
  MicroResInterface,
  PatternEnum,
} from '@irole/microservices';
import Redis from 'ioredis';
import { UsersRoles } from './entities/users-roles.entity';
import { Role } from '../role/entities/role.entity';
import { RoleEnum } from '../role/enum/role.enum';
import { AuthMicroserviceService } from './microservice/auth-microservice.service';
import { TokenService } from '../token/token.service';
import { TokenTypeEnum } from '../token/enum/token-type.enum';
import { LogoutResDto } from './dto/response/logout-res.dto';
import { JwtForgotPayload } from './interfaces/Jwt-forgot-payload';

@Injectable()
export class AuthService implements IAuthServiceInterface {
  constructor(
    private readonly authMicroserviceService: AuthMicroserviceService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ResetPassword)
    private readonly resetPasswordRep: Repository<ResetPassword>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject('RedisRefresh') private readonly redisRefresh: Redis,
  ) {}

  public async register(registerDto: RegisterDto): Promise<RegisterResDto> {
    const { email, password } = registerDto;
    const queryRunner: QueryRunner = await createTransaction(this.dataSource);
    const userRep: Repository<User> = queryRunner.manager.getRepository(User);
    const roleRep: Repository<Role> = queryRunner.manager.getRepository(Role);
    const usersRolesRep: Repository<UsersRoles> =
      queryRunner.manager.getRepository(UsersRoles);
    try {
      const userExist: User = await userRep.findOne({ where: { email } });
      if (userExist) {
        throw new ConflictException('This user is already registered!');
      }

      const hashedPassword: string = await bcryptPassword(password);

      const user: User = userRep.create({
        email,
        password: hashedPassword,
      });
      await userRep.save(user);

      // Role
      const role: Role = await roleRep.findOne({
        where: {
          name: RoleEnum.USER,
        },
        select: {
          id: true,
        },
      });

      const usersRoles: UsersRoles = usersRolesRep.create({
        user,
        role,
      });
      await usersRolesRep.save(usersRoles);

      //---------------------------------------

      const payload = {
        authId: user.id,
        email: user.email,
      };

      const result: MicroResInterface =
        await this.authMicroserviceService.sendToUserService(
          PatternEnum.USER_REGISTERED,
          payload,
          '10s',
        );

      if (result.error) {
        throw new InternalServerErrorException(result.reason.message);
      }

      await queryRunner.commitTransaction();
      return { message: 'Register Successfully' };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  public async login(loginDto: LoginDto): Promise<LoginResDto> {
    const { email, password } = loginDto;
    try {
      const user: User = await this.userRepository.findOne({
        where: { email, isDelete: false },
        select: {
          id: true,
          password: true,
          isActive: true,
          userRoles: {
            id: true,
            role: { id: true },
          },
        },
        relations: ['userRoles', 'userRoles.role'],
      });
      if (!user || !(await comparePassword(password, user.password))) {
        throw new UnauthorizedException('Invalid username or password!');
      }

      if (!user.isActive) {
        throw new ForbiddenException('Your account is not active!');
      }
      // Generate Tokens
      const roleIds: number[] = user.userRoles.map(
        (userRole) => userRole.role.id,
      );

      const refreshPayload: JwtRefreshPayload = {
        authId: user.id,
      };
      const accessPayload: JwtAccessPayload = {
        authId: user.id,
        roles: roleIds,
      };
      const refresh_token: string = this.tokenService.generateToken(
        refreshPayload,
        TokenTypeEnum.REFRESH,
      );
      const access_token: string = this.tokenService.generateToken(
        accessPayload,
        TokenTypeEnum.ACCESS,
      );
      // Save Refresh Token In Cache
      await this.redisRefresh.set(`REFRESH-${user.id}`, refresh_token);

      return { user, access_token, refresh_token };
    } catch (e) {
      throw e;
    }
  }

  public async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResDto> {
    const { email } = forgotPasswordDto;
    try {
      const user: User = await this.userRepository.findOne({
        where: { email, isDelete: false },
        select: {
          id: true,
          isActive: true,
        },
      });
      const payload: JwtForgotPayload = { authId: user.id };
      if (user && user.isActive) {
        const resetPassword: ResetPassword = this.resetPasswordRep.create({
          user: user,
          token: this.tokenService.generateToken(payload, TokenTypeEnum.EMAIL),
        });

        await this.resetPasswordRep.save(resetPassword);
        // send Email
      }
      return { message: 'Email Send Successfully' };
    } catch (e) {
      throw e;
    }
  }

  public async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResDto> {
    const { password, token } = resetPasswordDto;
    let payload: JwtForgotPayload;
    try {
      payload = this.tokenService.verify(
        token,
        this.configService.get('jwt.email_key'),
      );
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ForbiddenException('This Token Expired');
      }
      throw new ForbiddenException('Invalid token');
    }
    try {
      const resetPasswords: ResetPassword[] = await this.resetPasswordRep.find({
        where: {
          use: false,
          user: {
            id: payload.authId,
          },
        },
        select: {
          id: true,
          createdAt: true,
          token: true,
        },
        order: { createdAt: 'DESC' },
      });
      if (resetPasswords.length === 0) {
        throw new ForbiddenException('This Token Expired');
      }
      if (resetPasswords[0].token !== token) {
        throw new ForbiddenException('This Token Expired');
      }
      // Start a new transaction
      await this.dataSource.transaction(
        async (transactionalEntityManager: EntityManager): Promise<void> => {
          // Update ResetPassword Use to True
          await transactionalEntityManager.update(
            ResetPassword,
            { id: resetPasswords[0].id },
            { use: true },
          );

          // Update User Password
          await transactionalEntityManager.update(
            User,
            { id: payload.authId },
            {
              password: await bcryptPassword(password),
            },
          );
        },
      );
      return { message: 'Your password Changed Successfully' };
    } catch (err) {
      throw err;
    }
  }

  public refresh(authId: string): RefreshResDto {
    try {
      const payload: JwtRefreshPayload = { authId };
      const access_token: string = this.tokenService.generateToken(
        payload,
        TokenTypeEnum.ACCESS,
      );
      return { access_token };
    } catch (e) {
      throw e;
    }
  }

  public async logout(user: User): Promise<LogoutResDto> {
    try {
      await this.redisRefresh.set(`REFRESH-${user.id}`, '');
      return { message: 'Logout Successfully' };
    } catch (e) {
      throw e;
    }
  }

  public async validateUserByAuthId(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id, isDelete: false, isActive: true },
      select: {
        id: true,
        email: true,
        isActive: true,
        superAdmin: true,
      },
    });
  }
}
