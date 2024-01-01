import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { MinioService } from './minio.service';
import { CreateBucketDto } from './dto/create-bucket.dto';
import { ApiTags } from '@nestjs/swagger';
import { Bucket } from './schemas/bucket.schema';

@ApiTags('minio')
@Controller('minio')
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @Post()
  createBucket(@Body() createBucketDto: CreateBucketDto): Promise<Bucket> {
    return this.minioService.createBucket(createBucketDto);
  }

  @Get()
  findAll(): Promise<Bucket[]> {
    return this.minioService.findAll();
  }

  @Delete(':name')
  remove(@Param('name') name: string): Promise<string> {
    return this.minioService.removeBucket(name);
  }
}
