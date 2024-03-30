import { ApiProperty } from '@nestjs/swagger';
import { FindUsersDto } from './find-users.dto';

interface PageMetaDtoParameters {
  findUsersDto: FindUsersDto;
  itemCount: number;
}

export class PageMetaDto {
  @ApiProperty()
  readonly page: number;

  @ApiProperty()
  readonly take: number;

  @ApiProperty()
  readonly itemCount: number;

  @ApiProperty()
  readonly pageCount: number;

  @ApiProperty()
  readonly hasPreviousPage: boolean;

  @ApiProperty()
  readonly hasNextPage: boolean;

  constructor({ findUsersDto, itemCount }: PageMetaDtoParameters) {
    this.page = findUsersDto.page;
    this.take = findUsersDto.take;
    this.itemCount = itemCount;
    this.pageCount = Math.ceil(this.itemCount / this.take);
    this.hasPreviousPage = this.page > 1;
    this.hasNextPage = this.page < this.pageCount;
  }
}
