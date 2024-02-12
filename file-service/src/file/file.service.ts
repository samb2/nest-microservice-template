import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import * as path from 'path';
import { MinioService } from '../minio/minio.service';
import { ClientProxy } from '@nestjs/microservices';
import { FileRepository } from './file.repository';
import { BucketRepository } from '../minio/bucket.repository';
import { Bucket } from '../minio/schemas/bucket.schema';
import { File } from './schemas/file.schema';

@Injectable()
export class FileService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject(MinioService) private readonly minioService: MinioService,
    private readonly fileRepo: FileRepository,
    private readonly bucketRepo: BucketRepository,
  ) {
    this.authClient.connect().then();
  }

  async upload(image: any, userId: string): Promise<File> {
    const metaData: object = {
      'content-type': image.mimetype,
    };
    const extension: string = path.parse(image.originalname).ext;
    const filename: string = `${uuidV4()}`;
    const bucketKey: string = `profiles/${filename}${extension}`;

    const bucket: Bucket = await this.bucketRepo.findOne({
      name: 'images',
    });
    if (!bucket) {
      throw new Error('Bucket not found');
    }
    // Save to Minio
    await this.minioService.insertFile(
      bucket.name,
      bucketKey,
      image.buffer,
      metaData,
    );
    // Save to File
    return this.fileRepo.insert({
      name: image.originalname,
      bucket: bucket.id,
      key: bucketKey,
      size: image.size,
      mimeType: image.mimetype,
      uploadedBy: userId,
      path: `${bucket.name}/${bucketKey}`,
    });
  }

  async findAll(): Promise<File[]> {
    return await this.fileRepo.find(
      {},
      { name: true, key: true, path: true, bucket: true, uploadedBy: true },
      { populate: 'bucket' },
    );
  }

  async findOne(id: any): Promise<File> {
    return this._fileExists(id);
  }

  async remove(id: any): Promise<string> {
    const file: File = await this._fileExists(id);
    await this.minioService.removeObject(file.bucket['name'], file.key);
    await this.fileRepo.findByIdAndDelete(id);
    return `This action removes a #${id} file`;
  }

  async _fileExists(id: any): Promise<File> {
    const file: File = await this.fileRepo.findById(
      id,
      { key: true, name: true, path: true, bucket: true },
      {
        populate: 'bucket',
        lean: true,
      },
    );
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }
}
