import { Injectable } from '@nestjs/common';
import { BucketRepository } from './bucket.repository';
import { Bucket } from './schemas/bucket.schema';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';
import { BucketEnum } from './enum/bucket.enum';

@Injectable()
export class MinioService {
  public minioService: Client;

  constructor(
    private readonly bucketRepo: BucketRepository,
    private readonly configService: ConfigService,
  ) {
    this.minioService = new Client({
      endPoint: this.configService.get('minio.endPoint'),
      port: parseInt(this.configService.get('minio.port')),
      useSSL: this.configService.get<boolean>('minio.useSSL'),
      accessKey: this.configService.get('minio.accessKey'),
      secretKey: this.configService.get('minio.secretKey'),
    });
  }

  async insertFile(
    bucketName: BucketEnum,
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

  async findAll(): Promise<Bucket[] | []> {
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

  async createBucketIfNotExist(bucketName: BucketEnum): Promise<boolean> {
    const bucketExist: boolean =
      await this.minioService.bucketExists(bucketName);
    if (bucketExist) {
      return bucketExist;
    }
    if (!bucketExist) {
      await this.minioService.makeBucket(bucketName);
      return true;
    }
  }
}
