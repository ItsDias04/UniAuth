import {
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { randomBytes } from 'crypto';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  IssueExternalRedirectTokenCommand,
  IssueExternalRedirectTokenCommandOutput,
} from '../commands/issue-external-redirect-token.command';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';
import {
  DEVELOPERS_CONSOLE_REDIS_REPOSITORY,
  IDevelopersConsoleRedisRepository,
} from '../../domain/repositories/developers-console-redis.repository.interface';

@CommandHandler(IssueExternalRedirectTokenCommand)
export class IssueExternalRedirectTokenHandler
  implements
    NestCommandHandler<
      IssueExternalRedirectTokenCommand,
      IssueExternalRedirectTokenCommandOutput
    >,
    ICommandHandler<
      IssueExternalRedirectTokenCommand,
      IssueExternalRedirectTokenCommandOutput
    >
{
  private readonly ttlSeconds = 1800;

  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
    @Inject(DEVELOPERS_CONSOLE_REDIS_REPOSITORY)
    private readonly redisRepository: IDevelopersConsoleRedisRepository,
  ) {}

  async execute(
    command: IssueExternalRedirectTokenCommand,
  ): Promise<IssueExternalRedirectTokenCommandOutput> {
    if (!command.applicationId?.trim()) {
      throw new BadRequestException('applicationId is required');
    }

    const application = await this.clientApplicationRepository.findById(
      command.applicationId,
    );

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const token = randomBytes(24).toString('hex');

    await this.redisRepository.saveExternalRedirectToken(
      {
        token,
        applicationId: application.id,
        redirectRoute: application.redirectRoute,
      },
      this.ttlSeconds,
    );

    const redirectUrl = appendQueryToken(application.redirectRoute, token);

    return new IssueExternalRedirectTokenCommandOutput(
      token,
      this.ttlSeconds,
      redirectUrl,
    );
  }
}

function appendQueryToken(route: string, token: string): string {
  const hasQuery = route.includes('?');
  const separator = hasQuery ? '&' : '?';
  return `${route}${separator}token=${encodeURIComponent(token)}`;
}
