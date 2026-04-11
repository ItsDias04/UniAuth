import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SecurityEventCategory } from '../../domain/entities/security-event-category.enum';

export class SecurityOfficerLoginDto {
  @ApiProperty({ example: 'security.officer' })
  @IsString()
  @IsNotEmpty()
  login: string;

  @ApiProperty({ example: 'StrongPassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SecurityEventsQueryDto {
  @ApiPropertyOptional({ enum: SecurityEventCategory })
  @IsOptional()
  @IsIn([
    SecurityEventCategory.NORMAL,
    SecurityEventCategory.SUSPICIOUS,
    SecurityEventCategory.PREVENTED,
  ])
  category?: SecurityEventCategory;

  @ApiPropertyOptional({
    description: 'Text filter by path, ip, userId or reason',
    example: 'sql injection',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @ApiPropertyOptional({
    description: 'Filter from UTC datetime',
    example: '2026-04-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    description: 'Filter to UTC datetime',
    example: '2026-04-11T23:59:59.000Z',
  })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    description:
      'Hide current security officer activity and SOC endpoints from results',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  excludeCurrentOfficer: boolean = true;
}

export class SecuritySummaryQueryDto {
  @ApiPropertyOptional({ default: 24, minimum: 1, maximum: 168 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  hours: number = 24;
}
