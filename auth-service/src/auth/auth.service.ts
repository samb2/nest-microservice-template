import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { RegisterResDto } from './dto/response/registerRes.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResDto } from './dto/response/loginRes.dto';
import { TokenTypeEnum } from './enum/token-type.enum';
import { bcryptPassword, comparePassword } from '../utils/password.util';
import { JwtRefreshPayload } from '../common/passport/refreshToken.strategy';
import { ForgotPasswordResDto } from './dto/response/forgotPasswordRes.dto';
import { ForgotPasswordDto } from './dto/forgotPassword.dto';
import { User } from './entities/user.entity';
import { ResetPassword } from './entities/reset-password.entity';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { ResetPasswordResDto } from './dto/response/resetPasswordRes.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RefreshResDto } from './dto/response/refreshRes.dto';
import { IAuthServiceInterface } from './interfaces/IAuthService.interface';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Injectable()
export class AuthService implements IAuthServiceInterface {
  constructor(
    @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ResetPassword)
    private readonly resetPasswordRep: Repository<ResetPassword>,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async sendToQueue(pattern: string, data: any): Promise<Observable<any>> {
    return this.userClient.emit(pattern, data);
  }

  public async register(registerDto: RegisterDto): Promise<RegisterResDto> {
    const { email, password } = registerDto;
    try {
      if (await this.userExists(email)) {
        throw new ConflictException('This user is already registered!');
      }

      const hashedPassword: string = await bcryptPassword(password);

      const user: User = this.userRepository.create({
        email,
        password: hashedPassword,
      });
      await this.userRepository.save(user);
      // send to express with rabbitmq
      await this.sendToQueue('user_created', user);
      return { message: 'Register Successfully' };
    } catch (e) {
      throw e;
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
      const payload: JwtRefreshPayload = { email };
      const refresh_token: string = this.generateToken(
        payload,
        TokenTypeEnum.REFRESH,
      );
      const access_token: string = this.generateToken(
        payload,
        TokenTypeEnum.ACCESS,
      );
      // Save Refresh Token In Cache
      await this.cacheManager.set(user.email, refresh_token);

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
          token: this.generateToken({ email }, TokenTypeEnum.EMAIL),
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

  public refresh(email: string): RefreshResDto {
    const access_token: string = this.generateToken(
      { email },
      TokenTypeEnum.ACCESS,
    );
    return { access_token };
  }

  public async logout(user: User): Promise<object> {
    try {
      await this.cacheManager.set(user.email, '');
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
    });
  }

  public generateToken(payload: object, type: TokenTypeEnum): string {
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
