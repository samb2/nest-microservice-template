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
  Query,
} from '@nestjs/common';
import { FileService } from './file.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ImageFilterInterceptor } from './interceptors/image-filter.interceptor';
import { File } from './schemas/file.schema';
import {
  MongoIdValidationPipe,
  PermissionEnum,
  Permissions,
  RequestWithUser,
} from '@samb2/nest-microservice';
import { ApiOkResponseSuccess } from '../utils/ApiOkResponseSuccess.util';
import { AccessTokenGuard, PermissionGuard } from '../utils/guard';
import {
  DeleteFileResDto,
  GetFileQueryDto,
  UploadFileDto,
  UploadFileResDto,
} from './dto';
import { Types } from 'mongoose';
import { PaginateResponseInterface } from '../database/interfaces/paginate-response.interface';

@ApiTags('files')
@Controller('files')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized.' })
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.CREATE_AVATAR)
  @Post('/upload/avatar')
  @ApiOperation({
    summary: 'Upload avatar',
    description: 'Upload a new avatar for the user.',
  })
  @ApiOkResponseSuccess(UploadFileResDto)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized.' })
  @ApiInternalServerErrorResponse()
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload avatar',
    type: UploadFileDto,
  })
  @UseInterceptors(FileInterceptor('file'), ImageFilterInterceptor)
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithUser,
  ): Promise<File> {
    return this.fileService.uploadAvatar(file, req.user);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_FILE)
  @Get()
  @ApiOperation({ summary: 'Find all files' })
  @ApiOkResponseSuccess(UploadFileResDto, 200, true)
  findAll(
    @Query() getFileDto?: GetFileQueryDto,
  ): Promise<PaginateResponseInterface<File[]>> {
    return this.fileService.findAll(getFileDto);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.READ_FILE)
  @Get(':id')
  @ApiOperation({ summary: 'Find one file' })
  @ApiOkResponseSuccess(UploadFileResDto)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiNotFoundResponse({ description: 'File not found' })
  @UsePipes(new MongoIdValidationPipe())
  async findOne(@Param('id') id: string): Promise<File> {
    // convert id to mongoId
    const mongoId: Types.ObjectId = new Types.ObjectId(id);
    return this.fileService.findOne(mongoId);
  }

  @UseGuards(AccessTokenGuard, PermissionGuard)
  @Permissions(PermissionEnum.DELETE_FILE)
  @Delete(':id')
  @ApiOperation({ summary: 'Delete one file' })
  @ApiOkResponseSuccess(DeleteFileResDto)
  @ApiBadRequestResponse({ description: 'Bad Request!' })
  @ApiNotFoundResponse({ description: 'File not found' })
  @UsePipes(new MongoIdValidationPipe())
  remove(@Param('id') id: string): Promise<DeleteFileResDto> {
    // convert id to mongoId
    const mongoId: Types.ObjectId = new Types.ObjectId(id);
    return this.fileService.remove(mongoId);
  }
}
