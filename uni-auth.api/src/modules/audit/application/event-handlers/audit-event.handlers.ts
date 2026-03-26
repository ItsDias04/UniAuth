import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { randomUUID } from 'crypto';
import {
  IAuditLogRepository,
  AUDIT_LOG_REPOSITORY,
} from '../../domain/repositories/audit-log.repository.interface';
import {
  AuditLogEntry,
  AuditAction,
  AuditSeverity,
} from '../../domain/entities/audit-log-entry.entity';
import { UserRegisteredEvent } from '../../../identity/domain/events/user-registered.event';
import { UserBlockedEvent } from '../../../identity/domain/events/user-blocked.event';
import { LoginSucceededEvent } from '../../../auth/domain/events/login-succeeded.event';
import { LoginFailedEvent } from '../../../auth/domain/events/login-failed.event';
import { MfaEnabledEvent } from '../../../mfa/domain/events/mfa-enabled.event';
import { MfaVerifiedEvent } from '../../../mfa/domain/events/mfa-verified.event';
import { MfaFailedEvent } from '../../../mfa/domain/events/mfa-failed.event';

@EventsHandler(UserRegisteredEvent)
export class UserRegisteredAuditHandler implements IEventHandler<UserRegisteredEvent> {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: IAuditLogRepository,
  ) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.auditRepo.save(
      AuditLogEntry.create(
        randomUUID(),
        AuditAction.USER_REGISTERED,
        AuditSeverity.INFO,
        event.userId,
        event.ip,
        null,
        { email: event.email },
      ),
    );
  }
}

@EventsHandler(UserBlockedEvent)
export class UserBlockedAuditHandler implements IEventHandler<UserBlockedEvent> {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: IAuditLogRepository,
  ) {}

  async handle(event: UserBlockedEvent): Promise<void> {
    await this.auditRepo.save(
      AuditLogEntry.create(
        randomUUID(),
        AuditAction.USER_BLOCKED,
        AuditSeverity.WARNING,
        event.userId,
        null,
        null,
        { reason: event.reason, blockedBy: event.blockedBy },
      ),
    );
  }
}

@EventsHandler(LoginSucceededEvent)
export class LoginSucceededAuditHandler implements IEventHandler<LoginSucceededEvent> {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: IAuditLogRepository,
  ) {}

  async handle(event: LoginSucceededEvent): Promise<void> {
    await this.auditRepo.save(
      AuditLogEntry.create(
        randomUUID(),
        AuditAction.LOGIN_SUCCESS,
        AuditSeverity.INFO,
        event.userId,
        event.ip,
        event.userAgent,
        { email: event.email },
      ),
    );
  }
}

@EventsHandler(LoginFailedEvent)
export class LoginFailedAuditHandler implements IEventHandler<LoginFailedEvent> {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: IAuditLogRepository,
  ) {}

  async handle(event: LoginFailedEvent): Promise<void> {
    await this.auditRepo.save(
      AuditLogEntry.create(
        randomUUID(),
        AuditAction.LOGIN_FAILED,
        AuditSeverity.WARNING,
        null,
        event.ip,
        null,
        { email: event.email, reason: event.reason },
      ),
    );
  }
}

@EventsHandler(MfaEnabledEvent)
export class MfaEnabledAuditHandler implements IEventHandler<MfaEnabledEvent> {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: IAuditLogRepository,
  ) {}

  async handle(event: MfaEnabledEvent): Promise<void> {
    await this.auditRepo.save(
      AuditLogEntry.create(
        randomUUID(),
        AuditAction.MFA_ENABLED,
        AuditSeverity.INFO,
        event.userId,
        null,
        null,
        { mfaType: event.mfaType, deviceId: event.deviceId },
      ),
    );
  }
}

@EventsHandler(MfaVerifiedEvent)
export class MfaVerifiedAuditHandler implements IEventHandler<MfaVerifiedEvent> {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: IAuditLogRepository,
  ) {}

  async handle(event: MfaVerifiedEvent): Promise<void> {
    await this.auditRepo.save(
      AuditLogEntry.create(
        randomUUID(),
        AuditAction.MFA_VERIFIED,
        AuditSeverity.INFO,
        event.userId,
        null,
        null,
        { challengeId: event.challengeId },
      ),
    );
  }
}

@EventsHandler(MfaFailedEvent)
export class MfaFailedAuditHandler implements IEventHandler<MfaFailedEvent> {
  constructor(
    @Inject(AUDIT_LOG_REPOSITORY) private readonly auditRepo: IAuditLogRepository,
  ) {}

  async handle(event: MfaFailedEvent): Promise<void> {
    await this.auditRepo.save(
      AuditLogEntry.create(
        randomUUID(),
        AuditAction.MFA_FAILED,
        AuditSeverity.WARNING,
        event.userId,
        null,
        null,
        { challengeId: event.challengeId, reason: event.reason },
      ),
    );
  }
}
