import { forwardRef, Module } from "@nestjs/common";
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { MinioModule } from '../minio/minio.module';
import { MongooseModule } from '@nestjs/mongoose';
import { File, FileSchema } from './schemas/file.schema';
import { FileRepository } from './file.repository';
import { Bucket, BucketSchema } from '../minio/schemas/bucket.schema';
import { MicroserviceModule } from '../microservice/microservice.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: File.name, schema: FileSchema },
      { name: Bucket.name, schema: BucketSchema },
    ]),
    MinioModule,
    forwardRef(() => MicroserviceModule),
  ],
  controllers: [FileController],
  providers: [FileService, FileRepository],
  exports: [FileRepository],
})
export class FileModule {}
