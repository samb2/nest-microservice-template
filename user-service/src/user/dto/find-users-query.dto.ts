import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FindUsersQueryDto {
  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  is_delete: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  is_active: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  admin: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  readonly sort?: 'asc' | 'desc' = 'asc';

  @ApiPropertyOptional({
    enum: ['id', 'first_name', 'last_name', 'email', 'created_at'],
    default: 'created_at',
  })
  @IsOptional()
  readonly sortField?: 'first_name' | 'last_name';

  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  readonly page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 50,
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  readonly take?: number = 10;

  get skip(): number {
    return (this.page - 1) * this.take;
  }
}
