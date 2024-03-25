import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import * as path from 'path';
import { MinioService } from '../minio/minio.service';
import { ClientProxy } from '@nestjs/microservices';
import { FileRepository } from './file.repository';
import { BucketRepository } from '../minio/bucket.repository';
import { Bucket } from '../minio/schemas/bucket.schema';
import { File } from './schemas/file.schema';
import { BucketEnum } from '../minio/bucket.enum';
import {
  generateMessage,
  MicroResInterface,
  MicroSendInterface,
  PatternEnum,
  sendMicroMessage,
  ServiceNameEnum,
} from '@irole/microservices';

@Injectable()
export class FileService {
  constructor(
    @Inject(ServiceNameEnum.USER) private readonly userClient: ClientProxy,
    @Inject(MinioService) private readonly minioService: MinioService,
    private readonly fileRepo: FileRepository,
    private readonly bucketRepo: BucketRepository,
  ) {
    this.userClient.connect().then();
  }

  //todo add transaction for mongo
  async uploadAvatar(image: any, user: any): Promise<any> {
    const metaData: object = {
      'content-type': image.mimetype,
    };
    const extension: string = path.parse(image.originalname).ext;
    const filename: string = `${uuidV4()}`;
    const bucketKey: string = `${filename}${extension}`;

    const bucket: Bucket = await this.bucketRepo.findOne({
      name: BucketEnum.AVATAR,
    });
    if (!bucket) {
      throw new Error(`Bucket ${BucketEnum.AVATAR} not found`);
    }
    try {
      // Save to Minio
      await this.minioService.insertFile(
        bucket.name,
        bucketKey,
        image.buffer,
        metaData,
      );
      // Save to File
      const file: File = await this.fileRepo.insert({
        name: image.originalname,
        bucket: bucket.id,
        key: bucketKey,
        size: image.size,
        mimeType: image.mimetype,
        uploadedBy: user.id,
        path: `${bucket.name}/${bucketKey}`,
      });
      // send to user service
      const payload = {
        authId: user.id,
        avatar: `${bucket.name}/${bucketKey}`,
      };
      const message: MicroSendInterface = generateMessage(
        ServiceNameEnum.FILE,
        ServiceNameEnum.USER,
        payload,
      );
      const result: MicroResInterface = await sendMicroMessage(
        this.userClient,
        PatternEnum.USER_AVATAR_UPLOADED,
        message,
      );

      if (result.data.delete) {
        await this.minioService.removeObject(
          BucketEnum.AVATAR,
          result.data.avatar,
        );
        await this.fileRepo.findOneAndDelete({ key: result.data.avatar });
      }
      if (result.error) {
        throw new InternalServerErrorException(result.reason.message);
      }
      return file;
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async findAll(): Promise<File[]> {
    return await this.fileRepo.find(
      {},
      { name: true, key: true, path: true, bucket: true, uploadedBy: true },
      { populate: 'bucket' },
    );
  }

  async findOne(id: string): Promise<File> {
    return this._fileExists(id);
  }

  async remove(id: any): Promise<string> {
    try {
      const file: File = await this._fileExists(id);
      const bucketName = file.bucket['name'];

      if (bucketName === BucketEnum.AVATAR) {
        await this.minioService.removeObject(bucketName, file.key);
        await this.fileRepo.findByIdAndDelete(id);
        // send to user service
        const payload = {
          authId: file.uploadedBy,
          avatar: `${file.key}`,
        };
        const message: MicroSendInterface = generateMessage(
          ServiceNameEnum.FILE,
          ServiceNameEnum.USER,
          payload,
        );
        const result: MicroResInterface = await sendMicroMessage(
          this.userClient,
          PatternEnum.USER_AVATAR_DELETED,
          message,
        );
        if (result.error) {
          throw new InternalServerErrorException(result.reason.message);
        }
      }
      return `This action removes a #${id} file`;
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async _fileExists(id: any): Promise<File> {
    const file: File = await this.fileRepo.findById(
      id,
      { key: true, name: true, path: true, bucket: true, uploadedBy: true },
      {
        populate: 'bucket',
      },
    );
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }
}
