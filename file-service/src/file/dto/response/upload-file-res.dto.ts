import { ApiProperty } from '@nestjs/swagger';

export class BucketDTO {
  @ApiProperty()
  name: string;

  @ApiProperty()
  id: string;
}

export class ResultDTO {
  @ApiProperty()
  name: string;

  @ApiProperty()
  key: string;

  @ApiProperty({ type: () => BucketDTO })
  bucket: BucketDTO;

  @ApiProperty()
  path: string;

  @ApiProperty()
  uploadedBy: string;

  @ApiProperty({})
  uploadedAt: Date;

  @ApiProperty()
  id: string;
}

export class UploadFileResDto {
  @ApiProperty({ type: () => [ResultDTO] })
  results: ResultDTO[];

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  pageCount: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  hasPreviousPage: boolean;

  @ApiProperty()
  hasNextPage: boolean;
}
