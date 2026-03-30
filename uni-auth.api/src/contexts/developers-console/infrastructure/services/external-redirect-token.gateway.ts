import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  DEVELOPERS_CONSOLE_REDIS_REPOSITORY,
  IDevelopersConsoleRedisRepository,
} from '../../domain/repositories/developers-console-redis.repository.interface';
import {
  ExternalRedirectTokenValidationResult,
  IExternalRedirectTokenGateway,
} from '../../application/services/external-redirect-token-gateway.interface';

@Injectable()
export class ExternalRedirectTokenGateway implements IExternalRedirectTokenGateway {
  constructor(
    @Inject(DEVELOPERS_CONSOLE_REDIS_REPOSITORY)
    private readonly redisRepository: IDevelopersConsoleRedisRepository,
  ) {}

  async validateAndConsume(
    token: string,
  ): Promise<ExternalRedirectTokenValidationResult> {
    const state =
      await this.redisRepository.consumeExternalRedirectToken(token);

    if (!state) {
      throw new BadRequestException('Redirect token is invalid or expired');
    }

    return {
      applicationId: state.applicationId,
      redirectRoute: state.redirectRoute,
    };
  }
}
