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
  MongoIdValidationPipe, PatternEnum,
  PermissionEnum,
  Permissions
} from "@irole/microservices";
import { AccessTokenGuard } from '../utils/guard/jwt-access.guard';
import { PermissionGuard } from '../utils/guard/permission.guard';
import { Ctx, MessagePattern, Payload, RmqContext } from "@nestjs/microservices";
import { DeleteAvatarDto } from "./dto/delete-avatar.dto";

@ApiTags('file')
@Controller('file')
@ApiBearerAuth()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @MessagePattern(PatternEnum.USER_AVATAR_DELETED)
  microDeleteAvatar(
    @Payload() deleteAvatarDto: DeleteAvatarDto,
    @Ctx() context: RmqContext,
  ) {
    return this.fileService.microDeleteAvatar(deleteAvatarDto, context);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.CREATE_AVATAR)
  @Post('/upload/avatar')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadFileDto })
  @UseInterceptors(FileInterceptor('file'), ImageFilterInterceptor)
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ): any {
    return this.fileService.uploadAvatar(file, req.user);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_FILE)
  @UseGuards(AccessTokenGuard)
  @Get()
  findAll(): Promise<File[]> {
    return this.fileService.findAll();
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_FILE)
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
