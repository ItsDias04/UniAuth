import { BaseEntity } from '../../../../common/domain';

export enum LoginAttemptStatus {
  SUCCESS = 'success',
  FAILED_CREDENTIALS = 'failed_credentials',
  FAILED_MFA = 'failed_mfa',
  BLOCKED = 'blocked',
  LOCKED = 'locked',
}

/**
 * Domain Entity — попытка входа.
 * Используется для Audit и brute-force protection.
 */
export class LoginAttempt extends BaseEntity<string> {
  private constructor(
    id: string,
    private readonly _email: string,
    private readonly _ip: string,
    private readonly _userAgent: string,
    private readonly _status: LoginAttemptStatus,
    private _userId: string | null,
  ) {
    super(id);
  }

  static create(
    id: string,
    email: string,
    ip: string,
    userAgent: string,
    status: LoginAttemptStatus,
    userId: string | null = null,
  ): LoginAttempt {
    return new LoginAttempt(id, email, ip, userAgent, status, userId);
  }

  static reconstitute(props: {
    id: string;
    email: string;
    ip: string;
    userAgent: string;
    status: LoginAttemptStatus;
    userId: string | null;
    createdAt: Date;
  }): LoginAttempt {
    const attempt = new LoginAttempt(
      props.id,
      props.email,
      props.ip,
      props.userAgent,
      props.status,
      props.userId,
    );
    attempt._createdAt = props.createdAt;
    return attempt;
  }

  get email(): string {
    return this._email;
  }
  get ip(): string {
    return this._ip;
  }
  get userAgent(): string {
    return this._userAgent;
  }
  get status(): LoginAttemptStatus {
    return this._status;
  }
  get userId(): string | null {
    return this._userId;
  }
}
