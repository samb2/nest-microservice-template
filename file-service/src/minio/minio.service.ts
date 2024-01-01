import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateBucketDto } from './dto/create-bucket.dto';
import { MinioService as MinioPackageService } from 'nestjs-minio-client';
import { BucketRepository } from './bucket.repository';
import { Bucket } from './schemas/bucket.schema';

@Injectable()
export class MinioService {
  constructor(
    private readonly minioService: MinioPackageService,
    private readonly bucketRepo: BucketRepository,
  ) {}

  async createBucket(createBucketDto: CreateBucketDto): Promise<Bucket> {
    try {
      // Save the bucket object to the database
      await this._createBucketIfNotExist(createBucketDto.name);
      // Check if the bucket already exists, create it if it doesn't.
      return await this.bucketRepo.insert({
        name: createBucketDto.name,
      });
    } catch (e) {
      throw e;
    }
  }

  async insertFile(
    bucketName: string,
    buketKey: string,
    file: any,
    metaData: any,
  ): Promise<void> {
    try {
      this.minioService.client.putObject(bucketName, buketKey, file, metaData);
    } catch (e) {
      throw e;
    }
  }

  async findAll(): Promise<Bucket[]> {
    return this.bucketRepo.find({});
  }

  async listBuckets(): Promise<any[]> {
    return this.minioService.client.listBuckets();
  }

  async removeBucket(bucketName: string): Promise<string> {
    try {
      const bucketExist: boolean = await this._bucketExists(bucketName);
      if (!bucketExist) {
        throw new NotFoundException('Bucket not found');
      }
      await this.minioService.client.removeBucket(bucketName).catch((error) => {
        throw new InternalServerErrorException(error.message);
      });
      await this.bucketRepo.findOneAndDelete({
        name: bucketName,
      });
      return `This action removes a ${bucketName} Bucket`;
    } catch (e) {
      throw e;
    }
  }

  async removeObject(bucketName: string, bucketKey: string): Promise<string> {
    await this.minioService.client.removeObject(
      bucketName, // bucket name
      bucketKey, // object name
    );
    return `This action removes a #${bucketKey}`;
  }

  async _createBucketIfNotExist(bucketName: string): Promise<void> {
    const bucketExist: boolean = await this._bucketExists(bucketName);
    if (bucketExist) {
      throw new ConflictException(`Bucket ${bucketName} already exists`);
    }
    if (!bucketExist) {
      await this.minioService.client.makeBucket(bucketName);
    }
  }

  async _bucketExists(bucketName: string): Promise<boolean> {
    return this.minioService.client.bucketExists(bucketName);
  }
}
