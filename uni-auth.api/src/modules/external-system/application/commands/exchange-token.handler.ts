import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { ExchangeTokenCommand } from './exchange-token.command';
import {
  EXTERNAL_CLIENT_REPOSITORY,
  IExternalClientRepository,
} from '../../domain/repositories/external-client.repository.interface';
import {
  AUTHORIZATION_CODE_REPOSITORY,
  IAuthorizationCodeRepository,
} from '../../domain/repositories/authorization-code.repository.interface';
import { ITokenService } from '../../../token/domain/services/token.service.interface';
import { TOKEN_SERVICE } from '../../../token/domain/services/token.service.interface';

@CommandHandler(ExchangeTokenCommand)
export class ExchangeTokenHandler implements ICommandHandler<ExchangeTokenCommand> {
  constructor(
    @Inject(EXTERNAL_CLIENT_REPOSITORY)
    private readonly clientRepository: IExternalClientRepository,
    @Inject(AUTHORIZATION_CODE_REPOSITORY)
    private readonly authCodeRepository: IAuthorizationCodeRepository,
    @Inject(TOKEN_SERVICE)
    private readonly tokenService: ITokenService,
  ) {}

  async execute(command: ExchangeTokenCommand): Promise<{
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
  }> {
    if (command.grantType !== 'authorization_code') {
      throw new BadRequestException('Поддерживается только grant_type=authorization_code');
    }

    // Аутентификация клиента
    const client = await this.clientRepository.findByClientId(command.clientId);
    if (!client) {
      throw new UnauthorizedException('Неизвестный client_id');
    }

    if (!client.isActive) {
      throw new UnauthorizedException('OAuth2 клиент неактивен');
    }

    if (!client.verifySecret(command.clientSecret)) {
      throw new UnauthorizedException('Неверный client_secret');
    }

    // Поиск authorization code
    const codeHash = createHash('sha256').update(command.code).digest('hex');
    const authCode = await this.authCodeRepository.findByCodeHash(codeHash);
    if (!authCode) {
      throw new BadRequestException('Код авторизации не найден или истёк');
    }

    // Валидация и exchange
    authCode.exchange(command.code, command.redirectUri, command.codeVerifier);
    await this.authCodeRepository.save(authCode);

    // Выпуск токенов
    const tokenPair = await this.tokenService.issueTokenPair({
      sub: authCode.userId,
      email: '', // resolved at token service level
      roles: [],
      clientId: client.clientId,
    });

    return {
      access_token: tokenPair.accessToken,
      refresh_token: tokenPair.refreshToken,
      token_type: 'Bearer',
      expires_in: 900,
      scope: authCode.scopes.join(' '),
    };
  }
}
