import { ApiProperty } from '@nestjs/swagger';

export class GetUserResDto {
  @ApiProperty({})
  id: string;

  @ApiProperty({})
  auth_id: string;

  @ApiProperty({})
  email: string;

  @ApiProperty({})
  avatar: string;

  @ApiProperty({})
  first_name: string;

  @ApiProperty({})
  last_name: string;

  @ApiProperty({})
  is_active: boolean;

  @ApiProperty({ default: false })
  is_delete: boolean;

  @ApiProperty({ default: false })
  admin: boolean;

  @ApiProperty({})
  created_at: Date;

  constructor(partial: Partial<GetUserResDto>) {
    Object.assign(this, partial);
  }
}
