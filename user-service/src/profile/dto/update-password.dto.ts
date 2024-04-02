import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEqualTo } from '../../utils/decorator/is-equal-to.decorator';

export class UpdatePasswordDto {
  @ApiProperty({ example: '12345678', required: true })
  @IsOptional()
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: '87654321', required: true })
  @IsOptional()
  @IsString()
  newPassword: string;

  @ApiProperty({ example: '87654321', required: true })
  @IsOptional()
  @IsString()
  @IsEqualTo('newPassword', {
    message: 'reNewPassword must match newPassword exactly.',
  })
  reNewPassword: string;
}
