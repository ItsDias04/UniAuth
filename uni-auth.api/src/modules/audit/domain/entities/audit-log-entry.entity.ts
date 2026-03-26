import { BaseEntity } from '../../../../common/domain';

export enum AuditAction {
  USER_REGISTERED = 'user.registered',
  USER_BLOCKED = 'user.blocked',
  USER_DEACTIVATED = 'user.deactivated',
  LOGIN_SUCCESS = 'auth.login.succeeded',
  LOGIN_FAILED = 'auth.login.failed',
  LOGOUT = 'auth.logout',
  MFA_ENABLED = 'mfa.enabled',
  MFA_VERIFIED = 'mfa.verified',
  MFA_FAILED = 'mfa.failed',
  TOKEN_ISSUED = 'token.issued',
  TOKEN_REVOKED = 'token.revoked',
  SESSION_CREATED = 'session.created',
  SESSION_REVOKED = 'session.revoked',
  PASSWORD_CHANGED = 'user.password_changed',
  ROLE_ASSIGNED = 'user.role_assigned',
  SUSPICIOUS_ACTIVITY = 'security.suspicious_activity',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * Domain Entity — Audit Log Entry.
 * Запись в журнале аудита — immutable after creation.
 */
export class AuditLogEntry extends BaseEntity<string> {
  private constructor(
    id: string,
    private readonly _action: AuditAction,
    private readonly _severity: AuditSeverity,
    private readonly _userId: string | null,
    private readonly _ip: string | null,
    private readonly _userAgent: string | null,
    private readonly _details: Record<string, any>,
    private readonly _timestamp: Date,
  ) {
    super(id);
  }

  static create(
    id: string,
    action: AuditAction,
    severity: AuditSeverity,
    userId: string | null,
    ip: string | null,
    userAgent: string | null,
    details: Record<string, any> = {},
  ): AuditLogEntry {
    return new AuditLogEntry(
      id,
      action,
      severity,
      userId,
      ip,
      userAgent,
      details,
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    action: AuditAction;
    severity: AuditSeverity;
    userId: string | null;
    ip: string | null;
    userAgent: string | null;
    details: Record<string, any>;
    timestamp: Date;
    createdAt: Date;
  }): AuditLogEntry {
    const entry = new AuditLogEntry(
      props.id,
      props.action,
      props.severity,
      props.userId,
      props.ip,
      props.userAgent,
      props.details,
      props.timestamp,
    );
    entry._createdAt = props.createdAt;
    return entry;
  }

  get action(): AuditAction { return this._action; }
  get severity(): AuditSeverity { return this._severity; }
  get userId(): string | null { return this._userId; }
  get ip(): string | null { return this._ip; }
  get userAgent(): string | null { return this._userAgent; }
  get details(): Record<string, any> { return { ...this._details }; }
  get timestamp(): Date { return this._timestamp; }
}
