import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { RegisterResDto } from './dto/response/registerRes.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResDto } from './dto/response/loginRes.dto';
import { TokenTypeEnum } from './enum/token-type.enum';
import { bcryptPassword, comparePassword } from '../utils/password.util';
import { ForgotPasswordResDto } from './dto/response/forgotPasswordRes.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { User } from './entities/user.entity';
import { ResetPassword } from './entities/reset-password.entity';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ResetPasswordResDto } from './dto/response/resetPasswordRes.dto';
import { RefreshResDto } from './dto/response/refreshRes.dto';
import { IAuthServiceInterface } from './interfaces/IAuthService.interface';
import { ClientProxy, RmqContext } from '@nestjs/microservices';
import { createTransaction } from '../utils/create-transaction.util';
import {
  generateMessage,
  generateResMessage,
  JwtAccessPayload,
  JwtRefreshPayload,
  MicroResInterface,
  MicroSendInterface,
  PatternEnum,
  sendMicroMessageWithTimeOut,
  ServiceNameEnum,
} from '@irole/microservices';
import Redis from 'ioredis';
import { UsersRoles } from './entities/users-roles.entity';
import { Role } from '../role/entities/role.entity';
import { RoleEnum } from '../role/enum/role.enum';

@Injectable()
export class AuthService implements IAuthServiceInterface {
  constructor(
    @Inject(ServiceNameEnum.USER) private readonly userClient: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ResetPassword)
    private readonly resetPasswordRep: Repository<ResetPassword>,
    private readonly dataSource: DataSource,
    @Inject('RedisRefresh') private readonly redisRefresh: Redis,
    @Inject('RedisCommon') private readonly redisCommon: Redis,
  ) {
    this.userClient.connect().then();
  }

  public async register(registerDto: RegisterDto): Promise<RegisterResDto> {
    const { email, password } = registerDto;
    const queryRunner: QueryRunner = await createTransaction(this.dataSource);
    const userRepository: Repository<User> =
      queryRunner.manager.getRepository(User);
    try {
      if (await this.userExists(email)) {
        throw new ConflictException('This user is already registered!');
      }

      const hashedPassword: string = await bcryptPassword(password);

      const user: User = userRepository.create({
        email,
        password: hashedPassword,
      });
      await userRepository.save(user);

      // Role
      const role: Role = await queryRunner.manager.getRepository(Role).findOne({
        where: {
          name: RoleEnum.USER,
        },
      });

      const usersRoles: UsersRoles = queryRunner.manager
        .getRepository(UsersRoles)
        .create({
          user,
          role,
        });
      await queryRunner.manager.getRepository(UsersRoles).save(usersRoles);

      //---------------------------------------

      const payload = {
        authId: user.id,
        email: user.email,
      };
      const message: MicroSendInterface = generateMessage(
        ServiceNameEnum.AUTH,
        ServiceNameEnum.USER,
        payload,
        '10s',
      );

      const result: MicroResInterface = await sendMicroMessageWithTimeOut(
        this.userClient,
        PatternEnum.USER_REGISTERED,
        message,
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
      const user: User = await this.validateUserByEmail(email);
      if (!user || !(await comparePassword(password, user.password))) {
        throw new UnauthorizedException('Invalid username or password!');
      }

      if (!user.isActive) {
        throw new ForbiddenException('your account is not active!');
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
      const refresh_token: string = this.generateToken(
        refreshPayload,
        TokenTypeEnum.REFRESH,
      );
      const access_token: string = this.generateToken(
        accessPayload,
        TokenTypeEnum.ACCESS,
      );
      // Save Refresh Token In Cache
      await this.redisRefresh.set(user.id, refresh_token);

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
      const user: User = await this.validateUserByEmail(email);
      if (user && user.isActive) {
        const resetPassword: ResetPassword = this.resetPasswordRep.create({
          user: user,
          token: this.generateToken({ authId: user.id }, TokenTypeEnum.EMAIL),
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

    try {
      this.jwtService.verify(token, {
        secret: this.configService.get('jwt.email_key'),
      });
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ForbiddenException('This Token Expired');
      }
      throw new ForbiddenException('Invalid token');
    }
    try {
      // Check Token Exist
      const resetPassword: ResetPassword = await this.resetPasswordRep.findOne({
        where: {
          token,
          use: false,
        },
        select: {
          id: true,
          createdAt: true,
          user: {
            id: true,
          },
        },
        relations: ['user'],
      });

      if (!resetPassword) {
        throw new ForbiddenException('This Token Expired');
      }

      // Get the latest reset password for user
      const latestResetPassword = await this.resetPasswordRep
        .createQueryBuilder('resetPassword')
        .where('resetPassword.user = :userId', {
          userId: resetPassword.user.id,
        })
        .orderBy('resetPassword.createdAt', 'DESC')
        .getOne();
      // Compare dates
      if (resetPassword.createdAt < latestResetPassword.createdAt) {
        throw new ForbiddenException('This Token Expired');
      }
      // Start a new transaction
      await this.dataSource.transaction(
        async (transactionalEntityManager: EntityManager): Promise<void> => {
          // Update ResetPassword Use to True
          await transactionalEntityManager.update(
            ResetPassword,
            resetPassword.id,
            { use: true },
          );

          // Update User Password
          await transactionalEntityManager.update(User, resetPassword.user.id, {
            password: await bcryptPassword(password),
          });
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
      const access_token: string = this.generateToken(
        payload,
        TokenTypeEnum.ACCESS,
      );
      return { access_token };
    } catch (e) {
      throw e;
    }
  }

  public async logout(user: User): Promise<object> {
    try {
      await this.redisRefresh.set(user.id, '');
      return { message: 'Logout Successfully' };
    } catch (e) {
      throw e;
    }
  }

  public async userExists(email: string): Promise<boolean> {
    const user: User = await this.userRepository.findOne({ where: { email } });
    return !!user;
  }

  public async validateUserByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { email, isDelete: false },
      relations: ['userRoles', 'userRoles.role'],
    });
  }

  public async validateUserByAuthId(id: string): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id, isDelete: false },
    });
  }

  public async verifyToken(
    payload: MicroResInterface,
    context: RmqContext,
  ): Promise<MicroResInterface> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      const user: User = await this.validateUserByAuthId(payload.data.authId);
      if (!user) {
        return generateResMessage(payload.from, payload.to, null, true, {
          message: 'User Not Found',
          status: 404,
        });
      }
      channel.ack(originalMsg);
      return generateResMessage(payload.from, payload.to, user, false);
    } catch (e) {
      await channel.reject(originalMsg, false);
      return generateResMessage(payload.from, payload.to, null, true, {
        message: e.message,
        status: 500,
      });
    }
  }

  public generateToken(
    payload: JwtRefreshPayload,
    type: TokenTypeEnum,
  ): string {
    let secretKey: string;
    switch (type) {
      case TokenTypeEnum.ACCESS:
        secretKey = this.configService.get('jwt.access_key');
        break;
      case TokenTypeEnum.REFRESH:
        secretKey = this.configService.get('jwt.refresh_key');
        break;
      case TokenTypeEnum.EMAIL:
        secretKey = this.configService.get('jwt.email_key');
        break;
      default:
        throw new Error('Invalid token type');
    }
    const expiresIn: string = type === TokenTypeEnum.REFRESH ? '30d' : '1d';
    return this.jwtService.sign(payload, { secret: secretKey, expiresIn });
  }
}
