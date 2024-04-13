import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  authId: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isDelete: boolean;

  @ApiProperty()
  admin: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class PageMetaDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  itemCount: number;

  @ApiProperty()
  pageCount: number;

  @ApiProperty()
  hasPreviousPage: boolean;

  @ApiProperty()
  hasNextPage: boolean;
}

export class GetAllUsersResDto {
  @ApiProperty({ type: [UserDto] })
  users: UserDto[];

  @ApiProperty({ type: PageMetaDto })
  pageMeta: PageMetaDto;

  constructor(partial: Partial<GetAllUsersResDto>) {
    Object.assign(this, partial);
  }
}
