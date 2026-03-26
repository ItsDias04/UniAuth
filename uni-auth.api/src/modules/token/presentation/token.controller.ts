import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { RefreshTokenDto } from '../application/dto/refresh-token.dto';
import {
  ITokenService,
  TOKEN_SERVICE,
} from '../domain/services/token.service.interface';

@Controller('token')
export class TokenController {
  constructor(
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  /**
   * POST /token/refresh — Обновление access token по refresh token.
   * Реализует Refresh Token Rotation (RFC 6749 + RFC 6819).
   */
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.tokenService.refreshTokens(dto.refreshToken);
  }
}
