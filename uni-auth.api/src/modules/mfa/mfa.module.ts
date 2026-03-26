import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MfaDeviceOrmEntity } from './infrastructure/persistence/mfa-device.orm-entity';
import { MfaDeviceRepository } from './infrastructure/persistence/mfa-device.repository';
import { MFA_DEVICE_REPOSITORY } from './domain/repositories/mfa-device.repository.interface';
import { RedisMfaChallengeStore } from './infrastructure/redis/mfa-challenge.store';
import { MFA_CHALLENGE_STORE } from './domain/repositories/mfa-challenge-store.interface';

import { SetupTotpHandler } from './application/commands/setup-totp.handler';
import { VerifyTotpHandler } from './application/commands/verify-totp.handler';
import { MfaController } from './presentation/mfa.controller';
import { IdentityModule } from '../identity/identity.module';

const CommandHandlers = [SetupTotpHandler, VerifyTotpHandler];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([MfaDeviceOrmEntity]),
    IdentityModule,
  ],
  controllers: [MfaController],
  providers: [
    {
      provide: MFA_DEVICE_REPOSITORY,
      useClass: MfaDeviceRepository,
    },
    {
      provide: MFA_CHALLENGE_STORE,
      useClass: RedisMfaChallengeStore,
    },
    ...CommandHandlers,
  ],
  exports: [MFA_DEVICE_REPOSITORY, MFA_CHALLENGE_STORE],
})
export class MfaModule {}
