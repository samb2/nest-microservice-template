import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioController } from './minio.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Bucket, BucketSchema } from './schemas/bucket.schema';
import { BucketRepository } from './bucket.repository';
import { redisCommonFactory } from '../redis/redis-client.factory';
import { BucketEnum } from './bucket.enum';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bucket.name, schema: BucketSchema }]),
  ],
  controllers: [MinioController],
  providers: [MinioService, BucketRepository, redisCommonFactory],
  exports: [MinioService],
})
export class MinioModule implements OnModuleInit {
  constructor(
    private readonly bucketRepo: BucketRepository,
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    if (this.configService.get('minio.synchronize')) {
      for (const existElement in BucketEnum) {
        const exist: boolean = await this.minioService.createBucketIfNotExist(
          BucketEnum[existElement],
        );
        if (!exist) {
          await this.bucketRepo.insert({
            name: BucketEnum[existElement],
          });
          Logger.log(`${BucketEnum[existElement]} created`);
        }
      }
    }
  }
}
