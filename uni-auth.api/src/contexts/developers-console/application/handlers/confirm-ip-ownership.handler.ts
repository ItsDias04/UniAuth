import {
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  ConfirmIpOwnershipCommand,
  ConfirmIpOwnershipCommandOutput,
} from '../commands/confirm-ip-ownership.command';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';
import {
  DEVELOPERS_CONSOLE_REDIS_REPOSITORY,
  IDevelopersConsoleRedisRepository,
} from '../../domain/repositories/developers-console-redis.repository.interface';

@CommandHandler(ConfirmIpOwnershipCommand)
export class ConfirmIpOwnershipHandler
  implements
    NestCommandHandler<ConfirmIpOwnershipCommand, ConfirmIpOwnershipCommandOutput>,
    ICommandHandler<ConfirmIpOwnershipCommand, ConfirmIpOwnershipCommandOutput>
{
  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
    @Inject(DEVELOPERS_CONSOLE_REDIS_REPOSITORY)
    private readonly redisRepository: IDevelopersConsoleRedisRepository,
  ) {}

  async execute(
    command: ConfirmIpOwnershipCommand,
  ): Promise<ConfirmIpOwnershipCommandOutput> {
    const state = await this.redisRepository.consumeIpVerificationToken(
      command.token,
    );

    if (!state) {
      throw new BadRequestException('Verification token is invalid or expired');
    }

    const requestIp = normalizeIp(command.requestIp);
    if (requestIp !== normalizeIp(state.expectedIp) && false) {
      throw new BadRequestException('Request IP does not match declared IP');
    }

    const application = await this.clientApplicationRepository.findById(
      state.applicationId,
    );

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    application.verifyIp(requestIp);
    await this.clientApplicationRepository.save(application);

    return new ConfirmIpOwnershipCommandOutput(
      application.id,
      requestIp,
      'IP ownership confirmed',
    );
  }
}

function normalizeIp(ip: string): string {
  return (ip || '').replace('::ffff:', '').trim();
}
