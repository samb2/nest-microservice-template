import { Injectable } from '@nestjs/common';
import { BucketRepository } from './bucket.repository';
import { Bucket } from './schemas/bucket.schema';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MinioService {
  public minioService;

  constructor(
    //private readonly minioService: MinioPackageService,
    private readonly bucketRepo: BucketRepository,
    private readonly configService: ConfigService,
  ) {
    this.minioService = new Client({
      endPoint: configService.get('minio.endPoint'),
      port: parseInt(configService.get('minio.port')),
      useSSL: configService.get<boolean>('minio.useSSL'),
      accessKey: configService.get('minio.accessKey'),
      secretKey: configService.get('minio.secretKey'),
    });
  }

  async insertFile(
    bucketName: string,
    buketKey: string,
    file: any,
    metaData: any,
  ): Promise<void> {
    try {
      this.minioService.putObject(bucketName, buketKey, file, metaData);
    } catch (e) {
      throw e;
    }
  }

  async findAll(): Promise<Bucket[]> {
    return this.bucketRepo.find({});
  }

  async listBuckets(): Promise<any[]> {
    return this.minioService.listBuckets();
  }

  async removeObject(bucketName: string, bucketKey: string): Promise<any> {
    await this.minioService.removeObject(
      bucketName, // bucket name
      bucketKey, // object name
    );
  }

  async createBucketIfNotExist(bucketName: string): Promise<boolean> {
    const bucketExist: boolean =
      await this.minioService.bucketExists(bucketName);
    if (bucketExist) {
      return bucketExist;
    }
    if (!bucketExist) {
      await this.minioService.makeBucket(bucketName);
    }
  }
}
