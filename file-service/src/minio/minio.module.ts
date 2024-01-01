import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { MinioController } from './minio.controller';
import { MinioModule as Minio } from 'nestjs-minio-client';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Bucket, BucketSchema } from './schemas/bucket.schema';
import { BucketRepository } from './bucket.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bucket.name, schema: BucketSchema }]),
    Minio.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        endPoint: configService.get('minio.endPoint'),
        port: parseInt(configService.get('minio.port')),
        useSSL: configService.get<boolean>('minio.useSSL'),
        accessKey: configService.get('minio.accessKey'),
        secretKey: configService.get('minio.secretKey'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [MinioController],
  providers: [MinioService, BucketRepository],
  exports: [MinioService],
})
export class MinioModule {}
