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
import { MicroResInterface, PatternEnum, User } from '@samb2/nest-microservice';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection, Types } from 'mongoose';
import { BucketEnum } from '../minio/enum/bucket.enum';
import { DeleteFileResDto, GetFileQueryDto } from './dto';
import { MicroserviceService } from '../microservice/microservice.service';
import { PaginateResponseInterface } from '../database/interfaces/paginate-response.interface';

@Injectable()
export class FileService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @Inject(MinioService) private readonly minioService: MinioService,
    private readonly fileRepo: FileRepository,
    private readonly bucketRepo: BucketRepository,
    private readonly microserviceService: MicroserviceService,
  ) {}

  async uploadAvatar(image: Express.Multer.File, user: User): Promise<File> {
    // Generate metadata for the file
    const metaData: object = {
      'content-type': image.mimetype,
    };

    // Extract file extension and generate filename
    const extension: string = path.parse(image.originalname).ext;
    const filename: string = `${uuidV4()}`;
    const bucketKey: string = `${filename}${extension}`;

    // Start a database transaction
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // Find the bucket for avatar files
      const bucket: Bucket = await this.bucketRepo.findOne(
        {
          name: BucketEnum.AVATAR,
        },
        { id: true, name: true },
        { session },
      );
      // If bucket is not found, throw an error
      if (!bucket) {
        throw new NotFoundException(`Bucket ${BucketEnum.AVATAR} not found`);
      }

      // Save file metadata to the database
      const file: File = await this.fileRepo.insertWithoutSave({
        name: image.originalname,
        bucket: bucket.id,
        key: bucketKey,
        size: image.size,
        mimeType: image.mimetype,
        uploadedBy: user.id,
        path: `${bucket.name}/${bucketKey}`,
      });
      await file.save({ session });

      // Send message to user service about avatar upload
      const payload = {
        authId: user.id,
        avatar: `${bucket.name}/${bucketKey}`,
      };
      const result: MicroResInterface =
        await this.microserviceService.sendToUserService(
          PatternEnum.USER_AVATAR_UPLOADED,
          payload,
        );

      // If there's an error response, throw an InternalServerErrorException
      if (result.error) {
        throw new InternalServerErrorException(result.reason.message);
      }

      // Save file to Minio storage
      await this.minioService.insertFile(
        BucketEnum.AVATAR,
        bucketKey,
        image.buffer,
        image.size,
        metaData,
      );

      // If there's a request to delete the old avatar, remove it from Minio and delete its metadata from the database
      if (result.data.delete) {
        await this.minioService.removeObject(
          BucketEnum.AVATAR,
          result.data.avatar,
        );
        await this.fileRepo.findOneAndDelete(
          { key: result.data.avatar },
          { session },
        );
      }

      // Commit the transaction
      await session.commitTransaction();

      // Return the uploaded file entity
      return file;
    } catch (e) {
      // If an error occurs, abort the transaction and throw the error
      await session.abortTransaction();
      throw e;
    } finally {
      // End the session
      await session.endSession();
    }
  }

  async findAll(
    getFileDto: GetFileQueryDto,
  ): Promise<PaginateResponseInterface<File[]>> {
    // Destructure query parameters
    const { sortField, take, page } = getFileDto;

    // Prepare sort object based on sortField and sort direction
    const sort = sortField
      ? { [sortField]: getFileDto.sort === 'ASC' ? 1 : -1 }
      : undefined;

    // Use paginate method from the repository to fetch paginated files
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

  async findOne(id: Types.ObjectId): Promise<File> {
    return this._findById(id);
  }

  async remove(id: Types.ObjectId): Promise<DeleteFileResDto> {
    // Start a database transaction
    const session: ClientSession = await this.connection.startSession();
    session.startTransaction();

    try {
      // Find the file by ID
      const file: File = await this._findById(id);

      // Get the bucket name associated with the file
      const bucketName = file.bucket['name'];

      // Delete the file from the repository
      await this.fileRepo.findByIdAndDelete(id, { session });

      // If the file was from the avatar bucket, send a message to the user service
      if (bucketName === BucketEnum.AVATAR) {
        // send to user service
        const payload = {
          authId: file.uploadedBy,
        };
        const result: MicroResInterface =
          await this.microserviceService.sendToUserService(
            PatternEnum.USER_AVATAR_DELETED,
            payload,
          );
        if (result.error) {
          throw new InternalServerErrorException(result.reason.message);
        }
      }

      // Remove the file from Minio storage
      await this.minioService.removeObject(bucketName, file.key);

      // Commit the transaction
      await session.commitTransaction();

      // Return success message
      return { message: `This action removes a #${id} file` };
    } catch (e) {
      // If an error occurs, abort the transaction and throw the error
      await session.abortTransaction();
      throw e;
    } finally {
      // End the session
      await session.endSession();
    }
  }

  async _findById(id: Types.ObjectId): Promise<File> {
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
