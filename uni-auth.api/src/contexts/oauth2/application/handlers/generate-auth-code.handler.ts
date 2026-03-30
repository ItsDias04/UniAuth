import { BadRequestException, Inject } from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { randomBytes } from 'crypto';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  GenerateAuthCodeCommand,
  GenerateAuthCodeCommandOutput,
} from '../commands/generate-auth-code.command';
import {
  IOAuthRedisRepository,
  OAUTH_REDIS_REPOSITORY,
} from '../../domain/repositories/oauth-redis.repository.interface';
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
    @Inject(EXTERNAL_REDIRECT_TOKEN_VERIFIER)
    private readonly externalTokenVerifier: IExternalRedirectTokenVerifier,
  ) {}

  async execute(
    command: GenerateAuthCodeCommand,
  ): Promise<GenerateAuthCodeCommandOutput> {
    const tokenValidation = await this.externalTokenVerifier.validateAndConsume(
      command.token1,
    );

    if (!tokenValidation.redirectRoute?.trim()) {
      throw new BadRequestException(
        'Redirect route is not configured for application',
      );
    }

    const token3 = randomBytes(32).toString('hex');

    await this.oauthRedisRepository.saveAuthorizationCode(
      {
        authCode: token3,
        userId: command.userId,
        clientId: tokenValidation.applicationId,
      },
      this.ttlSeconds,
    );

    const redirectUrl = appendQueryParam(
      tokenValidation.redirectRoute,
      'token3',
      token3,
    );

    return new GenerateAuthCodeCommandOutput(
      token3,
      this.ttlSeconds,
      redirectUrl,
    );
  }
}

function appendQueryParam(route: string, key: string, value: string): string {
  const separator = route.includes('?') ? '&' : '?';
  return `${route}${separator}${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
}
