import { IsString, IsArray, ArrayNotEmpty, IsOptional, IsIn, IsUrl } from 'class-validator';

export class RegisterClientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUrl({}, { each: true })
  redirectUris: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  scopes?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  grantTypes?: string[]; // e.g. authorization_code, client_credentials
}
