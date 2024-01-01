import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { MinioModule } from '../minio/minio.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './schemas/file.schema';
import { FileRepository } from './file.repository';
import { BucketRepository } from '../minio/bucket.repository';
import { Bucket, BucketSchema } from '../minio/schemas/bucket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Bucket.name, schema: BucketSchema },
    ]),
    MinioModule,
    ClientsModule.register([
      {
        name: 'AUTH_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://admin:master123@rabbitmq:5672'],
          queue: 'auth_queue',
          queueOptions: {
            durable: false,
          },
        },
      },
    ]),
  ],
  controllers: [FileController],
  providers: [FileService, FileRepository, BucketRepository],
})
export class FileModule {}
