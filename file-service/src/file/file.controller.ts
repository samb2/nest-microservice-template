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
import { MongoIdValidationPipe } from '../common/pipes/mongoId-validation.pipe';
import { AccessTokenGuard } from '../utils/passport/jwt-access.guard';

@ApiTags('file')
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  // TODO check which user upload (auth)
  @UseGuards(AccessTokenGuard)
  @Post('/upload/profile')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @UseInterceptors(FileInterceptor('file'), ImageFilterInterceptor)
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): Promise<File> {
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
