import {
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidV4 } from 'uuid';
import * as path from 'path';
import { MinioService } from '../minio/minio.service';
import { FileRepository } from './file.repository';
import { BucketRepository } from '../minio/bucket.repository';
import { Bucket } from '../minio/schemas/bucket.schema';
import { File } from './schemas/file.schema';
import { BucketEnum } from '../minio/bucket.enum';
import { MicroResInterface, PatternEnum } from '@irole/microservices';
import { FileMicroserviceService } from './microservice/file-microservice.service';
import { DeleteFileResDto } from './dto/response/delete-file-res.dto';
import { GetFileQueryDto } from './dto/get-file-query.dto';

@Injectable()
export class FileService {
  constructor(
    @Inject(MinioService) private readonly minioService: MinioService,
    private readonly fileRepo: FileRepository,
    private readonly bucketRepo: BucketRepository,
    private readonly fileMicroserviceService: FileMicroserviceService,
  ) {}

  //todo add transaction for mongo
  async uploadAvatar(image: any, user: any): Promise<File> {
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
      const result: MicroResInterface =
        await this.fileMicroserviceService.sendToUserService(
          PatternEnum.USER_AVATAR_UPLOADED,
          payload,
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

  async findAll(getFileDto: GetFileQueryDto): Promise<File[]> {
    const { sortField, take, page } = getFileDto;

    const sort = sortField
      ? { [sortField]: getFileDto.sort === 'ASC' ? 1 : -1 }
      : undefined;

    return await this.fileRepo.paginate(
      {},
      {
        name: true,
        key: true,
        path: true,
        bucket: true,
        uploadedBy: true,
        uploadedAt: true,
      },
      { populate: 'bucket', page, take, sort },
    );
  }

  async findOne(id: string): Promise<File> {
    return this._findById(id);
  }

  async remove(id: any): Promise<DeleteFileResDto> {
    try {
      const file: File = await this._findById(id);
      const bucketName = file.bucket['name'];
      await this.minioService.removeObject(bucketName, file.key);
      await this.fileRepo.findByIdAndDelete(id);
      if (bucketName === BucketEnum.AVATAR) {
        // send to user service
        const payload = {
          authId: file.uploadedBy,
          avatar: `${file.key}`,
        };
        const result: MicroResInterface =
          await this.fileMicroserviceService.sendToUserService(
            PatternEnum.USER_AVATAR_DELETED,
            payload,
          );
        if (result.error) {
          throw new InternalServerErrorException(result.reason.message);
        }
      }
      return { message: `This action removes a #${id} file` };
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async _findById(id: any): Promise<File> {
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
