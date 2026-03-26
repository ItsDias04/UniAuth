import { AggregateRoot } from '../../../../common/domain';

export enum SessionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

/**
 * Aggregate Root — Session (сессия пользователя).
 *
 * Отслеживает:
 * - устройство (fingerprint, user-agent)
 * - IP и геолокация
 * - время жизни & активность
 * - привязка к refresh token
 */
export class Session extends AggregateRoot<string> {
  private _userId: string;
  private _status: SessionStatus;
  private _ip: string;
  private _userAgent: string;
  private _deviceFingerprint: string | null;
  private _expiresAt: Date;
  private _lastActiveAt: Date;

  private constructor(
    id: string,
    userId: string,
    status: SessionStatus,
    ip: string,
    userAgent: string,
    deviceFingerprint: string | null,
    expiresAt: Date,
    lastActiveAt: Date,
  ) {
    super(id);
    this._userId = userId;
    this._status = status;
    this._ip = ip;
    this._userAgent = userAgent;
    this._deviceFingerprint = deviceFingerprint;
    this._expiresAt = expiresAt;
    this._lastActiveAt = lastActiveAt;
  }

  static create(
    id: string,
    userId: string,
    ip: string,
    userAgent: string,
    deviceFingerprint: string | null,
    ttlSeconds: number,
  ): Session {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    return new Session(
      id,
      userId,
      SessionStatus.ACTIVE,
      ip,
      userAgent,
      deviceFingerprint,
      expiresAt,
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    status: SessionStatus;
    ip: string;
    userAgent: string;
    deviceFingerprint: string | null;
    expiresAt: Date;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }): Session {
    const session = new Session(
      props.id,
      props.userId,
      props.status,
      props.ip,
      props.userAgent,
      props.deviceFingerprint,
      props.expiresAt,
      props.lastActiveAt,
    );
    session._createdAt = props.createdAt;
    session._updatedAt = props.updatedAt;
    return session;
  }

  // Getters
  get userId(): string { return this._userId; }
  get status(): SessionStatus { return this._status; }
  get ip(): string { return this._ip; }
  get userAgent(): string { return this._userAgent; }
  get deviceFingerprint(): string | null { return this._deviceFingerprint; }
  get expiresAt(): Date { return this._expiresAt; }
  get lastActiveAt(): Date { return this._lastActiveAt; }

  get isActive(): boolean {
    return this._status === SessionStatus.ACTIVE && this._expiresAt > new Date();
  }

  // Domain logic
  revoke(): void {
    this._status = SessionStatus.REVOKED;
    this.touch();
  }

  expire(): void {
    this._status = SessionStatus.EXPIRED;
    this.touch();
  }

  recordActivity(): void {
    this._lastActiveAt = new Date();
    this.touch();
  }

  extend(additionalSeconds: number): void {
    this._expiresAt = new Date(this._expiresAt.getTime() + additionalSeconds * 1000);
    this.touch();
  }
}
