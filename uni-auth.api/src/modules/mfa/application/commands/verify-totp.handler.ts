import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject, BadRequestException } from '@nestjs/common';
import { authenticator } from 'otplib';
import { VerifyTotpCommand } from './verify-totp.command';
import {
  IMfaDeviceRepository,
  MFA_DEVICE_REPOSITORY,
} from '../../domain/repositories/mfa-device.repository.interface';
import { MfaType } from '../../domain/value-objects/mfa-type.vo';
import { MfaVerifiedEvent } from '../../domain/events/mfa-verified.event';
import { MfaFailedEvent } from '../../domain/events/mfa-failed.event';

@CommandHandler(VerifyTotpCommand)
export class VerifyTotpHandler implements ICommandHandler<VerifyTotpCommand> {
  constructor(
    @Inject(MFA_DEVICE_REPOSITORY)
    private readonly mfaDeviceRepo: IMfaDeviceRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: VerifyTotpCommand): Promise<{ valid: boolean }> {
    const { userId, code } = command;

    // Ищем активное TOTP устройство
    const devices = await this.mfaDeviceRepo.findActiveByUserId(userId);
    const totpDevice = devices.find((d) => d.type === MfaType.TOTP);

    if (!totpDevice) {
      throw new BadRequestException('No TOTP device configured');
    }

    // Проверяем OTP код
    const isValid = authenticator.verify({
      token: code,
      secret: totpDevice.secret,
    });

    if (!isValid) {
      // Пробуем backup code
      const backupUsed = totpDevice.useBackupCode(code);
      if (backupUsed) {
        totpDevice.recordUsage();
        await this.mfaDeviceRepo.save(totpDevice);
        this.eventBus.publish(new MfaVerifiedEvent(userId, 'backup-code'));
        return { valid: true };
      }

      this.eventBus.publish(new MfaFailedEvent(userId, '', 'Invalid TOTP code'));
      return { valid: false };
    }

    // Если устройство ещё не подтверждено — подтверждаем
    if (!totpDevice.isVerified) {
      totpDevice.verify();
    }
    totpDevice.recordUsage();
    await this.mfaDeviceRepo.save(totpDevice);

    this.eventBus.publish(new MfaVerifiedEvent(userId, totpDevice.id));
    return { valid: true };
  }
}
