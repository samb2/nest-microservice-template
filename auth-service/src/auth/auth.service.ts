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
import { bcryptPassword, comparePassword } from '../utils/password.util';
import { createTransaction } from '../utils/create-transaction.util';
import {
  JwtAccessPayload,
  JwtRefreshPayload,
  MicroResInterface,
  PatternEnum,
} from '@samb2/nest-microservice';
import { RoleEnum } from '../role/enum/role.enum';
import { TokenService } from '../token/token.service';
import { TokenTypeEnum } from '../token/enum/token-type.enum';
import {
  ForgotPasswordDto,
  ForgotPasswordResDto,
  LoginDto,
  LoginResDto,
  LogoutResDto,
  RefreshResDto,
  RegisterDto,
  RegisterResDto,
  ResetPasswordDto,
  ResetPasswordResDto,
} from './dto';
import { IAuthServiceInterface, JwtForgotPayload } from './interfaces';
import { ResetPassword, User, UsersRoles } from './entities';
import { Role } from '../role/entities';
import { RedisAuthService } from '../redis';
import { MicroserviceService } from '../microservice/microservice.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventEnum } from '../events/enum/event.enum';

@Injectable()
export class AuthService implements IAuthServiceInterface {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly microserviceService: MicroserviceService,
    private readonly tokenService: TokenService,
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ResetPassword)
    private readonly resetPasswordRep: Repository<ResetPassword>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(RedisAuthService)
    private readonly redisAuthService: RedisAuthService,
  ) {}

  public async register(registerDto: RegisterDto): Promise<RegisterResDto> {
    // Extract email and password from the DTO
    const { email, password } = registerDto;

    // Start a database transaction
    const queryRunner: QueryRunner = await createTransaction(this.dataSource);

    try {
      // Get repositories for user, role, and usersRoles entities
      const userRep: Repository<User> = queryRunner.manager.getRepository(User);
      const roleRep: Repository<Role> = queryRunner.manager.getRepository(Role);
      const usersRolesRep: Repository<UsersRoles> =
        queryRunner.manager.getRepository(UsersRoles);

      // Check if the user already exists
      const userExist: User = await userRep.findOne({ where: { email } });
      if (userExist) {
        throw new ConflictException('This user is already registered!');
      }

      // Hash the password
      const hashedPassword: string = await bcryptPassword(password);

      // Create and save the user entity
      const user: User = userRep.create({
        email,
        password: hashedPassword,
      });
      await userRep.save(user);

      // Retrieve the role for the user
      const role: Role = await roleRep.findOne({
        where: { name: RoleEnum.USER },
        select: { id: true },
      });

      // Create and save the usersRoles entity
      const usersRoles: UsersRoles = usersRolesRep.create({
        user,
        role,
      });
      await usersRolesRep.save(usersRoles);

      // Send a message to the user service about the new user registration
      const payload: object = {
        authId: user.id,
        email: user.email,
      };

      const result: MicroResInterface =
        await this.microserviceService.sendToUserService(
          PatternEnum.USER_REGISTERED,
          payload,
          '10s',
        );

      // If there's an error response, throw an InternalServerErrorException
      if (result.error) {
        throw new InternalServerErrorException(result.reason.message);
      }

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Return success response message
      return { message: 'Register Successfully' };
    } catch (e) {
      // If an error occurs, rollback the transaction and throw the error
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  public async login(loginDto: LoginDto): Promise<LoginResDto> {
    // Extract email and password from the DTO
    const { email, password } = loginDto;
    try {
      // Find the user by email and ensure they are not marked for deletion
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

      // If user doesn't exist or password doesn't match, throw UnauthorizedException
      if (!user || !(await comparePassword(password, user.password))) {
        throw new UnauthorizedException('Invalid username or password!');
      }

      // If user is not active, throw ForbiddenException
      if (!user.isActive) {
        throw new ForbiddenException('Your account is not active!');
      }

      // Generate tokens for the user
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
      const key: string = this.redisAuthService.generateRefreshKey(user.id);
      await this.redisAuthService.set(key, refresh_token);

      // Return user details and tokens
      return { user, access_token, refresh_token };
    } catch (e) {
      throw e;
    }
  }

  public async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResDto> {
    // Extract email from the DTO
    const { email } = forgotPasswordDto;

    try {
      // Find the user by email and ensure they are not marked for deletion
      const user: User = await this.userRepository.findOne({
        where: { email, isDelete: false },
        select: { id: true, isActive: true, email: true },
      });

      // If user exists and is active, generate reset password token and save it
      if (user && user.isActive) {
        const payload: JwtForgotPayload = { authId: user.id };
        const token: string = this.tokenService.generateToken(
          payload,
          TokenTypeEnum.EMAIL,
        );
        const resetPassword: ResetPassword = this.resetPasswordRep.create({
          user: user,
          token,
        });

        await this.resetPasswordRep.save(resetPassword);

        // send Email
        const emailPayload = {
          email: user.email,
          token,
        };

        this.eventEmitter.emit(EventEnum.FORGOT_PASSWORD, emailPayload);
      }

      // Return success message
      return { message: 'Email Send Successfully' };
    } catch (e) {
      throw e;
    }
  }

  public async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResDto> {
    // Extract password and token from the DTO
    const { password, token } = resetPasswordDto;

    let payload: JwtForgotPayload;

    try {
      // Verify the reset token
      payload = this.tokenService.verify(
        token,
        this.configService.get('jwt.email_key'),
      );
    } catch (error) {
      // Handle token verification error
      if (error instanceof TokenExpiredError) {
        throw new ForbiddenException('This Token Expired');
      }
      throw new ForbiddenException('Invalid token');
    }
    try {
      // Find reset password records for the user
      const resetPasswords: ResetPassword[] = await this.resetPasswordRep.find({
        where: {
          use: false,
          user: {
            id: payload.authId,
          },
        },
        select: { id: true, createdAt: true, token: true },
        order: { createdAt: 'DESC' },
      });

      // Check if reset password records exist
      if (resetPasswords.length === 0 || resetPasswords[0].token !== token) {
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

      // Return success message
      return { message: 'Your password Changed Successfully' };
    } catch (err) {
      throw err;
    }
  }

  public refresh(authId: string): RefreshResDto {
    try {
      // Generate new access token using the provided authId
      const payload: JwtRefreshPayload = { authId };
      const access_token: string = this.tokenService.generateToken(
        payload,
        TokenTypeEnum.ACCESS,
      );

      // Return the new access token in the response object
      return { access_token };
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }

  public async logout(user: User): Promise<LogoutResDto> {
    try {
      // Set the refresh token in Redis to an empty string to invalidate it
      const key: string = this.redisAuthService.generateRefreshKey(user.id);
      await this.redisAuthService.set(key, '');

      // Return success message
      return { message: 'Logout Successfully' };
    } catch (e) {
      throw new InternalServerErrorException(e.message);
    }
  }
}
