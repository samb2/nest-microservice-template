import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServiceNameEnum } from '@irole/microservices';
import { AuthMicroserviceController } from './microservice/auth-microservice.controller';
import { AuthMicroserviceService } from './microservice/auth-microservice.service';
import { TokenModule } from '../token/token.module';
import { ResetPassword, User } from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ResetPassword]),
    TokenModule,
    ClientsModule.registerAsync([
      {
        name: ServiceNameEnum.USER,
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
            queue: `${configService.get<string>('rabbitMq.user_queue')}`,
            queueOptions: {
              durable: true,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [AuthController, AuthMicroserviceController],
  providers: [AuthService, AuthMicroserviceService],
  exports: [AuthService],
})
export class AuthModule {}
