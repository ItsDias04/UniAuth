import {
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  CommandHandler,
  ICommandHandler as NestCommandHandler,
} from '@nestjs/cqrs';
import { randomBytes, randomUUID } from 'crypto';
import { ICommandHandler } from '../../../../common/cqrs';
import {
  VerifyAuthenticatorEmailCommand,
  VerifyAuthenticatorEmailCommandOutput,
} from '../commands/verify-authenticator-email.command';
import {
  AUTHENTICATOR_REDIS_REPOSITORY,
  IAuthenticatorRedisRepository,
} from '../../domain/repositories/authenticator-redis.repository.interface';
import {
  ITrustedDeviceRepository,
  TRUSTED_DEVICE_REPOSITORY,
} from '../../domain/repositories/trusted-device.repository.interface';
import { TrustedDevice } from '../../domain/entities/trusted-device.entity';

@CommandHandler(VerifyAuthenticatorEmailCommand)
export class VerifyAuthenticatorEmailHandler
  implements
    NestCommandHandler<VerifyAuthenticatorEmailCommand, VerifyAuthenticatorEmailCommandOutput>,
    ICommandHandler<VerifyAuthenticatorEmailCommand, VerifyAuthenticatorEmailCommandOutput>
{
  constructor(
    @Inject(AUTHENTICATOR_REDIS_REPOSITORY)
    private readonly authenticatorRedisRepository: IAuthenticatorRedisRepository,
    @Inject(TRUSTED_DEVICE_REPOSITORY)
    private readonly trustedDeviceRepository: ITrustedDeviceRepository,
  ) {}

  async execute(
    command: VerifyAuthenticatorEmailCommand,
  ): Promise<VerifyAuthenticatorEmailCommandOutput> {
    const pendingState = await this.authenticatorRedisRepository.findPendingLogin(
      command.loginAttemptId,
    );

    if (!pendingState) {
      throw new NotFoundException('Login attempt not found or expired');
    }

    if (pendingState.emailCode !== command.emailCode) {
      throw new BadRequestException('Invalid email verification code');
    }

    const secret = randomBytes(20).toString('hex');

    const trustedDevice = TrustedDevice.register({
      id: randomUUID(),
      userId: pendingState.userId,
      deviceName: pendingState.deviceName,
      deviceFingerprint: pendingState.deviceFingerprint,
      secret,
    });

    await this.trustedDeviceRepository.save(trustedDevice);
    await this.authenticatorRedisRepository.deletePendingLogin(
      command.loginAttemptId,
    );

    return new VerifyAuthenticatorEmailCommandOutput(
      trustedDevice.id,
      secret,
      'Trusted device registered successfully',
    );
  }
}
