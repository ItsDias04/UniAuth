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
  RequestIpOwnershipVerificationCommand,
  RequestIpOwnershipVerificationCommandOutput,
} from '../commands/request-ip-ownership-verification.command';
import {
  CLIENT_APPLICATION_REPOSITORY,
  IClientApplicationRepository,
} from '../../domain/repositories/client-application.repository.interface';
import {
  DEVELOPERS_CONSOLE_REDIS_REPOSITORY,
  IDevelopersConsoleRedisRepository,
} from '../../domain/repositories/developers-console-redis.repository.interface';

@CommandHandler(RequestIpOwnershipVerificationCommand)
export class RequestIpOwnershipVerificationHandler
  implements
    NestCommandHandler<
      RequestIpOwnershipVerificationCommand,
      RequestIpOwnershipVerificationCommandOutput
    >,
    ICommandHandler<
      RequestIpOwnershipVerificationCommand,
      RequestIpOwnershipVerificationCommandOutput
    >
{
  private readonly ttlSeconds = 600;

  constructor(
    @Inject(CLIENT_APPLICATION_REPOSITORY)
    private readonly clientApplicationRepository: IClientApplicationRepository,
    @Inject(DEVELOPERS_CONSOLE_REDIS_REPOSITORY)
    private readonly redisRepository: IDevelopersConsoleRedisRepository,
  ) {}

  async execute(
    command: RequestIpOwnershipVerificationCommand,
  ): Promise<RequestIpOwnershipVerificationCommandOutput> {
    if (!command.applicationId?.trim() || !command.ipAddress?.trim()) {
      throw new BadRequestException('applicationId and ipAddress are required');
    }

    const application = await this.clientApplicationRepository.findById(
      command.applicationId,
    );

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const token = randomBytes(24).toString('hex');

    await this.redisRepository.saveIpVerificationToken(
      {
        token,
        applicationId: application.id,
        expectedIp: normalizeIp(command.ipAddress),
      },
      this.ttlSeconds,
    );

    return new RequestIpOwnershipVerificationCommandOutput(
      token,
      this.ttlSeconds,
      'Call public confirmation endpoint from declared IP with this token',
    );
  }
}

function normalizeIp(ip: string): string {
  return ip.replace('::ffff:', '').trim();
}
