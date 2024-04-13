import { ApiProperty } from '@nestjs/swagger';

export class UploadFileResDto {
  @ApiProperty({})
  id: string;

  @ApiProperty({})
  name: string;

  @ApiProperty({})
  mimeType: string;

  @ApiProperty({})
  size: number;

  @ApiProperty({})
  key: string;

  @ApiProperty({})
  bucket: string;

  @ApiProperty({})
  path: string;

  @ApiProperty({})
  uploadedBy: string;

  @ApiProperty({})
  uploadedAt: string;
}
