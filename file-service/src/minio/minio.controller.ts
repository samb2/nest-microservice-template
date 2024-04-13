import { Controller, Get, UseGuards } from '@nestjs/common';
import { MinioService } from './minio.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Bucket } from './schemas/bucket.schema';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';
import { PermissionEnum, Permissions } from '@irole/microservices';
import { ApiOkResponseSuccess } from '../utils/ApiOkResponseSuccess.util';
import { GetBucketResDto } from './dto/response/get-bucket-res.dto';

@ApiTags('minio')
@Controller('minio')
export class MinioController {
  constructor(private readonly minioService: MinioService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_BUCKET)
  @Get()
  @ApiOperation({ summary: 'get all buckets' })
  @ApiOkResponseSuccess(GetBucketResDto, 200, true)
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiBearerAuth()
  findAll(): Promise<Bucket[] | []> {
    return this.minioService.findAll();
  }
}
