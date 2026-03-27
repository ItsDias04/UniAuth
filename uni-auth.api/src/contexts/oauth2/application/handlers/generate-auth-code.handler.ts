import { BadRequestException, Inject } from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { randomBytes } from 'crypto';
import {
  ICommandHandler,
} from '../../../../common/cqrs';
import {
  GenerateAuthCodeCommand,
  GenerateAuthCodeCommandOutput,
} from '../commands/generate-auth-code.command';
import {
  IOAuthRedisRepository,
  OAUTH_REDIS_REPOSITORY,
} from '../../domain/repositories/oauth-redis.repository.interface';
import {
  IOAuthClientValidator,
  OAUTH_CLIENT_VALIDATOR,
} from '../services/oauth-client-validator.interface';
import {
  EXTERNAL_REDIRECT_TOKEN_VERIFIER,
  IExternalRedirectTokenVerifier,
} from '../services/external-redirect-token-verifier.interface';

@CommandHandler(GenerateAuthCodeCommand)
export class GenerateAuthCodeHandler
  implements
    NestCommandHandler<GenerateAuthCodeCommand, GenerateAuthCodeCommandOutput>,
    ICommandHandler<GenerateAuthCodeCommand, GenerateAuthCodeCommandOutput>
{
  private readonly ttlSeconds = 120;

  constructor(
    @Inject(OAUTH_REDIS_REPOSITORY)
    private readonly oauthRedisRepository: IOAuthRedisRepository,
    @Inject(OAUTH_CLIENT_VALIDATOR)
    private readonly oauthClientValidator: IOAuthClientValidator,
    @Inject(EXTERNAL_REDIRECT_TOKEN_VERIFIER)
    private readonly externalTokenVerifier: IExternalRedirectTokenVerifier,
  ) {}

  async execute(
    command: GenerateAuthCodeCommand,
  ): Promise<GenerateAuthCodeCommandOutput> {
    const tokenValidation = await this.externalTokenVerifier.validateAndConsume(
      command.externalToken,
    );

    if (tokenValidation.applicationId !== command.clientId) {
      throw new BadRequestException(
        'External token does not belong to provided clientId',
      );
    }

    if (tokenValidation.redirectRoute !== command.redirectUri) {
      throw new BadRequestException(
        'External token redirect route mismatch',
      );
    }

    await this.oauthClientValidator.validate(
      command.clientId,
      command.redirectUri,
    );

    const authorizationCode = randomBytes(32).toString('hex');

    await this.oauthRedisRepository.saveAuthorizationCode(
      {
        authCode: authorizationCode,
        userId: command.userId,
        clientId: command.clientId,
      },
      this.ttlSeconds,
    );

    return new GenerateAuthCodeCommandOutput(authorizationCode, this.ttlSeconds);
  }
}
