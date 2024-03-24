import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './repository/user.repository';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AccessTokenStrategy } from '../utils/passport/accessToken.strategy';
import { redisCommonFactory } from '../redis/redis-client.factory';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepository,
    AccessTokenStrategy,
    redisCommonFactory,
  ],
})
export class UserModule {}
