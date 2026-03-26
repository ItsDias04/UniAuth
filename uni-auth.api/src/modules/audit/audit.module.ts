import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogOrmEntity } from './infrastructure/persistence/audit-log.orm-entity';
import { AuditLogRepository } from './infrastructure/persistence/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository.interface';

import {
  UserRegisteredAuditHandler,
  UserBlockedAuditHandler,
  LoginSucceededAuditHandler,
  LoginFailedAuditHandler,
  MfaEnabledAuditHandler,
  MfaVerifiedAuditHandler,
  MfaFailedAuditHandler,
} from './application/event-handlers/audit-event.handlers';

import { AuditController } from './presentation/audit.controller';

const EventHandlers = [
  UserRegisteredAuditHandler,
  UserBlockedAuditHandler,
  LoginSucceededAuditHandler,
  LoginFailedAuditHandler,
  MfaEnabledAuditHandler,
  MfaVerifiedAuditHandler,
  MfaFailedAuditHandler,
];

@Module({
  imports: [
    CqrsModule,
    TypeOrmModule.forFeature([AuditLogOrmEntity]),
  ],
  controllers: [AuditController],
  providers: [
    {
      provide: AUDIT_LOG_REPOSITORY,
      useClass: AuditLogRepository,
    },
    ...EventHandlers,
  ],
  exports: [AUDIT_LOG_REPOSITORY],
})
export class AuditModule {}
