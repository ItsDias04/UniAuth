import { CommandHandler, ICommandHandler, EventPublisher } from '@nestjs/cqrs';
import { Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuthorizeCommand } from './authorize.command';
import {
  EXTERNAL_CLIENT_REPOSITORY,
  IExternalClientRepository,
} from '../../domain/repositories/external-client.repository.interface';
import {
  AUTHORIZATION_CODE_REPOSITORY,
  IAuthorizationCodeRepository,
} from '../../domain/repositories/authorization-code.repository.interface';
import { AuthorizationCode } from '../../domain/entities/authorization-code.entity';
import { AuthorizationGrantedEvent } from '../../domain/events/authorization-granted.event';

@CommandHandler(AuthorizeCommand)
export class AuthorizeHandler implements ICommandHandler<AuthorizeCommand> {
  constructor(
    @Inject(EXTERNAL_CLIENT_REPOSITORY)
    private readonly clientRepository: IExternalClientRepository,
    @Inject(AUTHORIZATION_CODE_REPOSITORY)
    private readonly authCodeRepository: IAuthorizationCodeRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(command: AuthorizeCommand): Promise<{ code: string; state: string; redirectUri: string }> {
    if (command.responseType !== 'code') {
      throw new BadRequestException('Поддерживается только response_type=code');
    }

    const client = await this.clientRepository.findByClientId(command.clientId);
    if (!client) {
      throw new NotFoundException('OAuth2 клиент не найден');
    }

    if (!client.isActive) {
      throw new BadRequestException('OAuth2 клиент неактивен');
    }

    if (!client.isRedirectUriAllowed(command.redirectUri)) {
      throw new BadRequestException('redirect_uri не зарегистрирован для данного клиента');
    }

    if (!client.isGrantTypeAllowed('authorization_code')) {
      throw new BadRequestException('Клиент не поддерживает authorization_code grant');
    }

    if (!client.areScopesAllowed(command.scopes)) {
      throw new BadRequestException('Запрошенные scopes не разрешены для данного клиента');
    }

    // Создание authorization code
    const { authCode, plainCode } = AuthorizationCode.create({
      id: randomUUID(),
      clientDbId: client.id,
      userId: command.userId,
      redirectUri: command.redirectUri,
      scopes: command.scopes,
      codeChallenge: command.codeChallenge,
      codeChallengeMethod: command.codeChallengeMethod,
    });

    await this.authCodeRepository.save(authCode);

    // Публикация события
    this.publisher.mergeObjectContext({} as any).publish(
      new AuthorizationGrantedEvent(command.userId, client.id, command.scopes),
    );

    return {
      code: plainCode,
      state: command.state,
      redirectUri: command.redirectUri,
    };
  }
}
