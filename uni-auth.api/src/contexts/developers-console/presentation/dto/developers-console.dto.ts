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

export class IssueExternalRedirectTokenDto {
  @ApiProperty({ example: 'f0d8f1e4-59f7-454e-8a11-345b6f447d26' })
  @IsString()
  applicationId: string;
}

export class ConsumeExternalRedirectTokenDto {
  @ApiProperty({ example: '6f31ae2b2e643e1329139bc30f008593ef06a4f9740f8e55' })
  @IsString()
  token: string;
}

export class SetApplicationRouteDto {
  @ApiProperty({ example: '/callback' })
  @IsString()
  redirectRoute: string;
}
