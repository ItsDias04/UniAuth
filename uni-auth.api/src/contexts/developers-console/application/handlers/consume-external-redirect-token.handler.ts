import { BadRequestException, Inject } from '@nestjs/common';
import {
  IQueryHandler as NestQueryHandler,
  QueryHandler,
} from '@nestjs/cqrs';
import { IQueryHandler } from '../../../../common/cqrs';
import {
  ConsumeExternalRedirectTokenOutput,
  ConsumeExternalRedirectTokenQuery,
} from '../queries/consume-external-redirect-token.query';
import {
  DEVELOPERS_CONSOLE_REDIS_REPOSITORY,
  IDevelopersConsoleRedisRepository,
} from '../../domain/repositories/developers-console-redis.repository.interface';

@QueryHandler(ConsumeExternalRedirectTokenQuery)
export class ConsumeExternalRedirectTokenHandler
  implements
    NestQueryHandler<
      ConsumeExternalRedirectTokenQuery,
      ConsumeExternalRedirectTokenOutput
    >,
    IQueryHandler<ConsumeExternalRedirectTokenQuery, ConsumeExternalRedirectTokenOutput>
{
  constructor(
    @Inject(DEVELOPERS_CONSOLE_REDIS_REPOSITORY)
    private readonly redisRepository: IDevelopersConsoleRedisRepository,
  ) {}

  async execute(
    query: ConsumeExternalRedirectTokenQuery,
  ): Promise<ConsumeExternalRedirectTokenOutput> {
    const state = await this.redisRepository.consumeExternalRedirectToken(
      query.token,
    );

    if (!state) {
      throw new BadRequestException('Redirect token is invalid or expired');
    }

    return new ConsumeExternalRedirectTokenOutput(
      state.applicationId,
      state.redirectRoute,
      'Redirect token is valid and consumed',
    );
  }
}
