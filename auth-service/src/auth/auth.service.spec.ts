import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import {
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ResetPassword } from './entities/reset-password.entity';
import configuration from '../config/configuration';
import {
  inValidEmailUser,
  validUser,
  wrongPassword,
} from '../../test/constants/userData';
import { RegisterResDto } from './dto/response/registerRes.dto';
import * as bcrypt from 'bcrypt';
import { bcryptPassword } from '../utils/password.util';
import { LoginResDto } from './dto/response/loginRes.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

// Mocking the User and ResetPassword repositories
class UserRepositoryMock {
  findOne() {}

  create() {}

  save() {}

  update() {}
}

class ResetPasswordRepositoryMock {
  findOne() {}

  create() {}

  save() {}
}

class MockDataSource {}

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: Repository<User>;
  let resetPasswordRepository: Repository<ResetPassword>;
  let jwtService: JwtService;
  let dataSource: DataSource;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: `.env.test`,
          load: [configuration],
          cache: true,
        }),
      ],
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
            sign: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useClass: UserRepositoryMock,
        },
        {
          provide: getRepositoryToken(ResetPassword),
          useClass: ResetPasswordRepositoryMock,
        },
        { provide: DataSource, useClass: MockDataSource },
        {
          provide: CACHE_MANAGER,
          useValue: {
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    resetPasswordRepository = module.get<Repository<ResetPassword>>(
      getRepositoryToken(ResetPassword),
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      jest.spyOn(authService, 'userExists').mockResolvedValue(false);

      const result: RegisterResDto = await authService.register(validUser);

      expect(result).toEqual({
        message: expect.any(String),
      });
    });

    it('should throw error if user already exists', async () => {
      jest.spyOn(authService, 'userExists').mockResolvedValue(true);

      await expect(authService.register(validUser)).rejects.toThrowError(
        ConflictException,
      );
    });

    it('should hash the user password', async () => {
      // Mock user password
      const password = validUser.password;

      // Spy on bcrypt hash method
      const hashSpy = jest.spyOn(bcrypt, 'hashSync');
      // Call register method
      await authService.register(validUser);

      // Assert hash was called with password
      expect(hashSpy).toHaveBeenCalledWith(password, expect.any(String));
    });

    it('should throw error on db exception', async () => {
      // Mock DB error
      jest
        .spyOn(userRepository, 'save')
        .mockRejectedValueOnce(new Error('DB Error'));

      // Call service method
      try {
        await authService.register(validUser);

        // Should not reach this
        expect(true).toBeFalsy();
      } catch (error) {
        // Assert error handling
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toEqual('DB Error');
      }
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      // Mock successful login
      jest.spyOn(authService, 'validateUserByEmail').mockResolvedValueOnce({
        email: validUser.email,
        password: await bcryptPassword(validUser.password),
        isActive: true,
      } as User);

      // Call login method
      const res: LoginResDto = await authService.login(validUser);
      // Assertions
      expect(res.access_token).toBeDefined();
      expect(res.refresh_token).toBeDefined();
    });

    it('should throw if user does not exist', async () => {
      // User not found
      jest
        .spyOn(authService, 'validateUserByEmail')
        .mockResolvedValueOnce(undefined);

      await expect(authService.login(inValidEmailUser)).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it('should throw if password is invalid', async () => {
      // User found
      jest.spyOn(authService, 'validateUserByEmail').mockResolvedValueOnce({
        email: validUser.email,
        password: await bcryptPassword(validUser.password),
        isActive: true,
      } as User);

      // Invalid password
      await expect(authService.login(wrongPassword)).rejects.toThrowError(
        UnauthorizedException,
      );
    });

    it('should throw account is inActive', async () => {
      // User found
      jest.spyOn(authService, 'validateUserByEmail').mockResolvedValueOnce({
        email: validUser.email,
        password: await bcryptPassword(validUser.password),
        isActive: false,
      } as User);

      await expect(authService.login(validUser)).rejects.toThrowError(
        ForbiddenException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send an email when the user exists and is active', async () => {
      const email = 'test@example.com';
      const user = new User();
      user.isActive = true;
      user.email = email;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      jest
        .spyOn(resetPasswordRepository, 'create')
        .mockReturnValue({} as ResetPassword);
      jest
        .spyOn(resetPasswordRepository, 'save')
        .mockResolvedValue({} as ResetPassword);

      await authService.forgotPassword({ email });

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email, isDelete: false },
      });
      expect(resetPasswordRepository.create).toHaveBeenCalled();
      expect(resetPasswordRepository.save).toHaveBeenCalled();
    });

    it('should throw an error when the user does not exist', async () => {
      const email = 'test@example.com';

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(undefined);

      await expect(authService.forgotPassword({ email })).rejects.toThrow();
    });

    it('should throw an error when the user exists but is not active', async () => {
      const email = 'test@example.com';
      const user = new User();
      user.isActive = false;
      user.email = email;

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      expect(authService.forgotPassword({ email })).toBeDefined();
    });
  });

  describe('resetPassword', () => {
    it('should throw ForbiddenException when token is invalid', async () => {
      const resetPasswordDto = {
        password: 'newPassword',
        token: 'invalidToken',
      };
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error();
      });
      await expect(authService.resetPassword(resetPasswordDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when token is expired', async () => {
      const resetPasswordDto = {
        password: 'newPassword',
        token: 'expiredToken',
      };
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new TokenExpiredError('jwt expired', new Date());
      });
      await expect(authService.resetPassword(resetPasswordDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should update user password and reset password token use to true when token is valid', async () => {
      const resetPasswordDto = {
        password: 'newPassword',
        token: 'validToken',
      };
      const resetPassword: ResetPassword = {
        id: '1',
        user: { id: '1' } as User,
        token: 'validToken',
        use: false,
        createdAt: new Date(),
      };
      const user: User = {
        id: '1',
        email: 'test@test.com',
        password: 'oldPassword',
      } as User;
      jest.spyOn(jwtService, 'verify').mockReturnValue({});
      jest
        .spyOn(resetPasswordRepository, 'findOne')
        .mockResolvedValue(resetPassword);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);
      //jest
      // .spyOn(dataSource, 'transaction')
      // .mockImplementation((callback) => callback({}));
      const result = await authService.resetPassword(resetPasswordDto);
      expect(result).toEqual({ message: 'Your password Changed Successfully' });
      expect(resetPasswordRepository.update).toHaveBeenCalledWith(
        resetPassword.id,
        { use: true },
      );
      expect(userRepository.update).toHaveBeenCalledWith(user.id, {
        password: 'newPassword',
      });
    });
  });
});
