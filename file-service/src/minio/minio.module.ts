import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioController } from './minio.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bucket, BucketSchema } from './schemas/bucket.schema';
import { BucketRepository } from './bucket.repository';
import { redisCommonFactory } from '../redis/redis-client.factory';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bucket.name, schema: BucketSchema }]),
  ],
  controllers: [MinioController],
  providers: [MinioService, BucketRepository, redisCommonFactory],
  exports: [MinioService],
})
export class MinioModule {}
