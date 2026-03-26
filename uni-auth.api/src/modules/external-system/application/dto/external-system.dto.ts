import { IsString, IsArray, IsOptional, IsUrl, ArrayMinSize } from 'class-validator';

/**
 * DTO — регистрация нового OAuth2 клиента.
 */
export class RegisterClientDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description: string = '';

  @IsArray()
  @ArrayMinSize(1, { message: 'Необходимо указать хотя бы один redirect_uri' })
  @IsString({ each: true })
  redirectUris: string[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Необходимо указать хотя бы один grant_type' })
  @IsString({ each: true })
  allowedGrantTypes: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedScopes: string[] = ['openid', 'profile', 'email'];

  @IsOptional()
  @IsString()
  homepageUrl?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;
}

/**
 * DTO — обмен кода на токены.
 */
export class ExchangeTokenDto {
  @IsString()
  grant_type: string;

  @IsString()
  code: string;

  @IsString()
  redirect_uri: string;

  @IsString()
  client_id: string;

  @IsString()
  client_secret: string;

  @IsOptional()
  @IsString()
  code_verifier?: string;
}

/**
 * DTO — запрос авторизации.
 */
export class AuthorizeDto {
  @IsString()
  client_id: string;

  @IsString()
  redirect_uri: string;

  @IsString()
  response_type: string;

  @IsString()
  @IsOptional()
  scope: string = 'openid profile email';

  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  code_challenge?: string;

  @IsOptional()
  @IsString()
  code_challenge_method?: string;
}

/**
 * DTO — ответ при регистрации клиента.
 */
export class ClientResponseDto {
  id: string;
  name: string;
  description: string;
  clientId: string;
  clientSecret?: string; // только при регистрации
  redirectUris: string[];
  allowedGrantTypes: string[];
  allowedScopes: string[];
  status: string;
  homepageUrl: string | null;
  logoUrl: string | null;
  createdAt: Date;
}
