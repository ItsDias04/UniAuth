import { IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateSsoAuthCodeDto {
  @ApiProperty({ example: 'client-app-123' })
  @IsString()
  clientId: string;

  @ApiProperty({ example: 'https://external.app/callback' })
  @IsString()
  @IsUrl()
  redirectUri: string;

  @ApiPropertyOptional({ example: 'opaque-state-xyz' })
  @IsOptional()
  @IsString()
  state?: string;
}

export class ExchangeCodeForProfileDto {
  @ApiProperty({ example: '5f0fc86f7f4d7e8275b8de2f9152d8a3313b4e8d995620f47ab8b5e94018a899' })
  @IsString()
  authorizationCode: string;
}
