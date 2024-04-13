import { ApiProperty } from '@nestjs/swagger';

export class GetPermissionRes {
  @ApiProperty({})
  id: string;

  @ApiProperty({})
  access: string;

  constructor(partial: Partial<GetPermissionRes>) {
    Object.assign(this, partial);
  }
}
