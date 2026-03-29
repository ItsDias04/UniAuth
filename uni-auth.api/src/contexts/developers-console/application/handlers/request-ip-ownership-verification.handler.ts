import {
  BadRequestException,
  ForbiddenException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { randomBytes } from 'crypto';
import { lookup } from 'dns/promises';
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
    if (!command.actorUserId?.trim() || !command.applicationId?.trim()) {
      throw new BadRequestException('actorUserId and applicationId are required');
    }

    const application = await this.clientApplicationRepository.findById(
      command.applicationId,
    );

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.ownerUserId !== command.actorUserId) {
      throw new ForbiddenException('You are not allowed to verify IP for this application');
    }

    if (!application.ip) {
      throw new BadRequestException('Application IP is not configured');
    }

    const expectedIp = application.ip;

    const token = randomBytes(24).toString('hex');

    await this.redisRepository.saveIpVerificationToken(
      {
        token,
        applicationId: application.id,
        expectedIp: normalizeIp(expectedIp),
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

async function resolveRouteIp(redirectRoute: string): Promise<string> {
  let hostname: string;

  try {
    hostname = new URL(redirectRoute).hostname;
  } catch {
    throw new BadRequestException('Application redirectRoute is invalid URL');
  }

  try {
    const resolved = await lookup(hostname);
    return resolved.address;
  } catch {
    throw new BadRequestException('Unable to resolve redirectRoute host to IP');
  }
}

function normalizeIp(ip: string): string {
  return ip.replace('::ffff:', '').trim();
}
