import { Controller, Get, UseGuards } from '@nestjs/common';
import { MinioService } from './minio.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Bucket } from './schemas/bucket.schema';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';
import { PermissionEnum, Permissions } from '@irole/microservices';

@ApiTags('minio')
@Controller('minio')
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_BUCKET)
  @Get()
  @ApiBearerAuth()
  findAll(): Promise<Bucket[]> {
    return this.minioService.findAll();
  }
}
