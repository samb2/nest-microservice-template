import { ApiProperty } from '@nestjs/swagger';
import { PageMetaDto } from '../../../utils/dto/page-meta.dto';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  auth_id: string;

  @ApiProperty()
  avatar: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  is_delete: boolean;

  @ApiProperty()
  admin: boolean;

  @ApiProperty()
  created_at: Date;
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
