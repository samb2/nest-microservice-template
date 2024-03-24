import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { MinioService } from './minio.service';
import { CreateBucketDto } from './dto/create-bucket.dto';
import { ApiTags } from '@nestjs/swagger';
import { Bucket } from './schemas/bucket.schema';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';
import { PermissionEnum, Permissions } from '@irole/microservices';

@ApiTags('minio')
@Controller('minio')
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.CREATE_BUCKET)
  @Post()
  createBucket(@Body() createBucketDto: CreateBucketDto): Promise<Bucket> {
    return this.minioService.createBucket(createBucketDto);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_BUCKET)
  @Get()
  findAll(): Promise<Bucket[]> {
    return this.minioService.findAll();
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.DELETE_BUCKET)
  @Delete(':name')
  remove(@Param('name') name: string): Promise<string> {
    return this.minioService.removeBucket(name);
  }
}
