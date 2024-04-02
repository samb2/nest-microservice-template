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
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ServiceNameEnum } from '@irole/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt-access' }),
    JwtModule.register({}),
    ClientsModule.registerAsync([
      {
        name: ServiceNameEnum.AUTH,
        imports: [ConfigModule],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              `amqp://${configService.get<string>(
                'rabbitMq.username',
              )}:${configService.get<string>(
                'rabbitMq.password',
              )}@${configService.get<string>(
                'rabbitMq.host',
              )}:${configService.get<string>('rabbitMq.port')}`,
            ],
            queue: `${configService.get<string>('rabbitMq.auth_queue')}`,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
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
