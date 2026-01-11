import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MfaService } from './application/services/mfa.service';
import { MFAMethod } from './data/entities/mfa-method.entity';
import { TOTPConfig } from './data/entities/totp-config.entity';
import { BackupCode } from './data/entities/backup-code.entity';
import { MFAChallenge } from './data/entities/mfa-challenge.entity';
import { MfaController } from './infrastructure/controllers/mfa.controller';
import { CqrsModule } from '@nestjs/cqrs';
import { EnableTotpHandler } from './application/handlers/enable-totp.handler';

@Module({
  imports: [TypeOrmModule.forFeature([MFAMethod, TOTPConfig, BackupCode, MFAChallenge]), CqrsModule],
  controllers: [MfaController],
  providers: [MfaService, EnableTotpHandler],
  exports: [MfaService],
})
export class MfaModule {}
