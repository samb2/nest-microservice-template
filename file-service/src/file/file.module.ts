import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { MinioModule } from '../minio/minio.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './schemas/file.schema';
import { FileRepository } from './file.repository';
import { Bucket, BucketSchema } from '../minio/schemas/bucket.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServiceNameEnum } from '@irole/microservices';
import { redisCommonFactory } from '../redis/redis-client.factory';
import { FileMicroserviceController } from './microservice/file-microservice.controller';
import { FileMicroserviceService } from './microservice/file-microservice.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Bucket.name, schema: BucketSchema },
    ]),
    MinioModule,
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
  ],
  controllers: [FileController, FileMicroserviceController],
  providers: [
    FileService,
    FileRepository,
    FileMicroserviceService,
    redisCommonFactory,
  ],
  exports: [FileMicroserviceService],
})
export class FileModule {}
