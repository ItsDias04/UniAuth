import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { authenticator } from 'otplib';
import { SetupTotpCommand } from './setup-totp.command';
import {
  IMfaDeviceRepository,
  MFA_DEVICE_REPOSITORY,
} from '../../domain/repositories/mfa-device.repository.interface';
import { MfaDevice } from '../../domain/entities/mfa-device.entity';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../identity/domain/repositories/user.repository.interface';

export interface SetupTotpResult {
  secret: string;
  qrCodeUri: string;
  backupCodes: string[];
}

@CommandHandler(SetupTotpCommand)
export class SetupTotpHandler implements ICommandHandler<SetupTotpCommand> {
  constructor(
    @Inject(MFA_DEVICE_REPOSITORY)
    private readonly mfaDeviceRepo: IMfaDeviceRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: SetupTotpCommand): Promise<SetupTotpResult> {
    const { userId } = command;

    // Генерируем TOTP secret
    const secret = authenticator.generateSecret();

    // Генерируем backup codes (8 кодов)
    const backupCodes = Array.from({ length: 8 }, () =>
      randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase(),
    );

    // URI для QR-кода
    const qrCodeUri = authenticator.keyuri(userId, 'UniAuth', secret);

    // Создаём MFA устройство
    const device = MfaDevice.createTotp(
      randomUUID(),
      userId,
      secret,
      'Authenticator App',
      backupCodes,
    );

    await this.mfaDeviceRepo.save(device);

    // Включаем MFA у пользователя
    const user = await this.userRepository.findById(userId);
    if (user) {
      user.enableMfa();
      await this.userRepository.save(user);
    }

    // Публикуем события
    for (const event of device.domainEvents) {
      this.eventBus.publish(event);
    }
    device.clearDomainEvents();

    return { secret, qrCodeUri, backupCodes };
  }
}
