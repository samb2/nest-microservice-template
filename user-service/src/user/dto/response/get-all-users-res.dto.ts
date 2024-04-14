import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../utils/dto/page-meta.dto';

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

export class GetAllUsersResDto {
  @ApiProperty({ type: [UserDto] })
  users: UserDto[];

  @ApiProperty({ type: PageMetaDto })
  pageMeta: PageMetaDto;

  constructor(partial: Partial<GetAllUsersResDto>) {
    Object.assign(this, partial);
  }
}
