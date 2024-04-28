import { forwardRef, Module } from '@nestjs/common';
import { MicroserviceService } from './microservice.service';
import { MicroserviceController } from './microservice.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServiceNameEnum } from '@samb2/nest-microservice';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MinioModule } from '../minio/minio.module';
import { FileModule } from '../file/file.module';

@Module({
  imports: [
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
    forwardRef(() => FileModule),
    MinioModule,
  ],
  controllers: [MicroserviceController],
  providers: [MicroserviceService],
  exports: [MicroserviceService],
})
export class MicroserviceModule {}
