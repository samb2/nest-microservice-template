import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { redisCommonFactory } from '../redis/redis-client.factory';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ServiceNameEnum } from '@irole/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProfileMicroserviceService } from './microservice/profile-microservice.service';
import { ProfileMicroserviceController } from './microservice/profile-microservice.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    ClientsModule.registerAsync([
      {
        name: ServiceNameEnum.FILE,
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
            queue: `${configService.get<string>('rabbitMq.file_queue')}`,
            queueOptions: {
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
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
              durable: false,
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [ProfileController, ProfileMicroserviceController],
  providers: [ProfileService, ProfileMicroserviceService, redisCommonFactory],
})
export class ProfileModule {}
