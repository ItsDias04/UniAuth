import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateClientApplicationDto {
  @ApiProperty({ example: 'My Analytics App' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;
}

export class UpdateClientApplicationSettingsDto {
  @ApiPropertyOptional({ example: 'My Analytics App v2' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ example: 'https://partner.site/callback' })
  @IsOptional()
  @IsUrl()
  redirectRoute?: string;
}

export class AddIpToApplicationDto {
  @ApiProperty({ example: '0.0.0.0' })
  @IsString()
  ipAddress: string;
}

export class ConfirmIpOwnershipDto {
  @ApiProperty({ example: 'af973eb4d70f72f5751ff33f8d6260d9b58ec9e748df772d' })
  @IsString()
  token: string;
}

export class SetApplicationRouteDto {
  @ApiProperty({ example: '/callback' })
  @IsString()
  redirectRoute: string;
}
