import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiProperty({ example: 'Due', required: false })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiProperty({ type: Boolean })
  @IsOptional()
  is_active?: boolean;

  @ApiProperty({ type: Boolean, default: false })
  @IsOptional()
  is_delete?: boolean;

  @ApiProperty({ type: Boolean, default: false })
  @IsOptional()
  admin?: boolean;
}
