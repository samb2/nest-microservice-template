import {
  Controller,
  Get,
  Post,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  Req,
  UsePipes,
  UseGuards,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UploadFileDto } from './dto/upload-file.dto';
import { ImageFilterInterceptor } from './interceptors/image-filter.interceptor';
import { File } from './schemas/file.schema';
import {
  MongoIdValidationPipe,
  PermissionEnum,
  Permissions,
} from '@irole/microservices';
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';

//import { Permissions } from '../utils/decorator/permissions.decorator';

@ApiTags('file')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.CREATE_PROFILE_IMAGE)
  @Post('/upload/profile')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @UseInterceptors(FileInterceptor('file'), ImageFilterInterceptor)
  upload(@UploadedFile() file: Express.Multer.File, @Req() req: any): any {
    return this.fileService.upload(file, req.user);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  @ApiBearerAuth()
  findAll(): Promise<File[]> {
    return this.fileService.findAll();
  }

  @Get(':id')
  @UsePipes(new MongoIdValidationPipe())
  async findOne(@Param('id') id: string): Promise<File> {
    return this.fileService.findOne(id);
  }

  @Delete(':id')
  @UsePipes(new MongoIdValidationPipe())
  remove(@Param('id') id: string): Promise<string> {
    return this.fileService.remove(id);
  }
}
