import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { AuthorizeCommand } from '../application/commands/authorize.command';
import { ExchangeTokenCommand } from '../application/commands/exchange-token.command';
import { AuthorizeDto, ExchangeTokenDto } from '../application/dto/external-system.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

/**
 * Controller — OAuth2 эндпоинты для внешних систем.
 * Реализует Authorization Code Flow с PKCE.
 */
@Controller('oauth2')
export class OAuth2Controller {
  constructor(private readonly commandBus: CommandBus) {}

  /**
   * GET /api/v1/oauth2/authorize — запрос авторизации (Authorization Code Flow, шаг 1).
   * Пользователь должен быть аутентифицирован (через JWT).
   */
  @Get('authorize')
  async authorize(
    @Query() dto: AuthorizeDto,
    @CurrentUser() user: any,
    @Res() res: Response,
  ) {
    const result = await this.commandBus.execute(
      new AuthorizeCommand(
        dto.client_id,
        dto.redirect_uri,
        dto.response_type,
        dto.scope ? dto.scope.split(' ') : ['openid'],
        dto.state,
        user.sub,
        dto.code_challenge,
        dto.code_challenge_method,
      ),
    );

    // Перенаправление обратно к клиенту с кодом авторизации
    const redirectUrl = new URL(result.redirectUri);
    redirectUrl.searchParams.set('code', result.code);
    redirectUrl.searchParams.set('state', result.state);

    return res.redirect(HttpStatus.FOUND, redirectUrl.toString());
  }

  /**
   * POST /api/v1/oauth2/token — обмен кода авторизации на токены (шаг 2).
   * Публичный эндпоинт — аутентификация через client_id/client_secret в теле запроса.
   */
  @Post('token')
  @Public()
  async token(@Body() dto: ExchangeTokenDto) {
    return this.commandBus.execute(
      new ExchangeTokenCommand(
        dto.grant_type,
        dto.code,
        dto.redirect_uri,
        dto.client_id,
        dto.client_secret,
        dto.code_verifier,
      ),
    );
  }
}
