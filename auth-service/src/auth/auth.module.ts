import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { ResetPassword } from './entities/reset-password.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AccessTokenStrategy } from '../utils/passport/accessToken.strategy';
import { RefreshTokenStrategy } from '../utils/passport/refreshToken.strategy';
import { ServiceNameEnum } from '../common/enum/service-name.enum';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ResetPassword]),
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
    ClientsModule.register([
      {
        name: ServiceNameEnum.USER,
        transport: Transport.RMQ,
        options: {
          //TODO change user and password
          urls: ['amqp://admin:master123@localhost:5672'],
          queue: 'user_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenStrategy, RefreshTokenStrategy],
})
export class AuthModule {}
