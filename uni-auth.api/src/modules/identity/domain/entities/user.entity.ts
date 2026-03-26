import { AggregateRoot } from '../../../../common/domain';
import { Email } from '../../../../common/domain/value-objects/email.vo';
import { PasswordHash } from '../value-objects/password-hash.vo';
import { Role } from './role.entity';
import { UserRegisteredEvent } from '../events/user-registered.event';
import { UserBlockedEvent } from '../events/user-blocked.event';

export enum UserStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
  PENDING_VERIFICATION = 'pending_verification',
  DEACTIVATED = 'deactivated',
}

/**
 * Aggregate Root — User (пользователь системы).
 * Центральная сущность Bounded Context "Identity".
 *
 * Инварианты:
 * - email уникален (проверяется на уровне репозитория)
 * - пароль хешируется при создании
 * - заблокированный пользователь не может войти
 * - MFA статус управляется из MFA BC
 */
export class User extends AggregateRoot<string> {
  private _email: Email;
  private _passwordHash: PasswordHash;
  private _displayName: string;
  private _status: UserStatus;
  private _roles: Role[];
  private _mfaEnabled: boolean;
  private _failedLoginAttempts: number;
  private _lastLoginAt: Date | null;
  private _lockedUntil: Date | null;

  private constructor(
    id: string,
    email: Email,
    passwordHash: PasswordHash,
    displayName: string,
    status: UserStatus,
    roles: Role[],
    mfaEnabled: boolean,
    failedLoginAttempts: number,
    lastLoginAt: Date | null,
    lockedUntil: Date | null,
  ) {
    super(id);
    this._email = email;
    this._passwordHash = passwordHash;
    this._displayName = displayName;
    this._status = status;
    this._roles = roles;
    this._mfaEnabled = mfaEnabled;
    this._failedLoginAttempts = failedLoginAttempts;
    this._lastLoginAt = lastLoginAt;
    this._lockedUntil = lockedUntil;
  }

  /**
   * Factory method — регистрация нового пользователя.
   */
  static async register(
    id: string,
    emailStr: string,
    plainPassword: string,
    displayName: string,
    ip: string,
  ): Promise<User> {
    const email = Email.create(emailStr);
    const passwordHash = await PasswordHash.create(plainPassword);

    const user = new User(
      id,
      email,
      passwordHash,
      displayName,
      UserStatus.PENDING_VERIFICATION,
      [],
      false,
      0,
      null,
      null,
    );

    user.addDomainEvent(new UserRegisteredEvent(id, emailStr, ip));
    return user;
  }

  /**
   * Восстановление из persistence (без бизнес-правил).
   */
  static reconstitute(props: {
    id: string;
    email: string;
    passwordHash: string;
    displayName: string;
    status: UserStatus;
    roles: Role[];
    mfaEnabled: boolean;
    failedLoginAttempts: number;
    lastLoginAt: Date | null;
    lockedUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    const user = new User(
      props.id,
      Email.create(props.email),
      PasswordHash.fromHash(props.passwordHash),
      props.displayName,
      props.status,
      props.roles,
      props.mfaEnabled,
      props.failedLoginAttempts,
      props.lastLoginAt,
      props.lockedUntil,
    );
    user._createdAt = props.createdAt;
    user._updatedAt = props.updatedAt;
    return user;
  }

  // === Getters ===
  get email(): Email {
    return this._email;
  }

  get passwordHash(): PasswordHash {
    return this._passwordHash;
  }

  get displayName(): string {
    return this._displayName;
  }

  get status(): UserStatus {
    return this._status;
  }

  get roles(): ReadonlyArray<Role> {
    return [...this._roles];
  }

  get mfaEnabled(): boolean {
    return this._mfaEnabled;
  }

  get failedLoginAttempts(): number {
    return this._failedLoginAttempts;
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt;
  }

  get lockedUntil(): Date | null {
    return this._lockedUntil;
  }

  // === Domain logic ===

  get isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  get isLocked(): boolean {
    if (!this._lockedUntil) return false;
    return this._lockedUntil > new Date();
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return this._passwordHash.verify(plainPassword);
  }

  activate(): void {
    this._status = UserStatus.ACTIVE;
    this.touch();
  }

  block(reason: string, blockedBy: string): void {
    this._status = UserStatus.BLOCKED;
    this.touch();
    this.addDomainEvent(new UserBlockedEvent(this._id, reason, blockedBy));
  }

  deactivate(): void {
    this._status = UserStatus.DEACTIVATED;
    this.touch();
  }

  recordSuccessfulLogin(): void {
    this._failedLoginAttempts = 0;
    this._lastLoginAt = new Date();
    this._lockedUntil = null;
    this.touch();
  }

  recordFailedLogin(maxAttempts: number = 5, lockDurationMinutes: number = 15): void {
    this._failedLoginAttempts += 1;
    if (this._failedLoginAttempts >= maxAttempts) {
      this._lockedUntil = new Date(Date.now() + lockDurationMinutes * 60 * 1000);
    }
    this.touch();
  }

  enableMfa(): void {
    this._mfaEnabled = true;
    this.touch();
  }

  disableMfa(): void {
    this._mfaEnabled = false;
    this.touch();
  }

  assignRole(role: Role): void {
    if (!this._roles.find((r) => r.id === role.id)) {
      this._roles.push(role);
      this.touch();
    }
  }

  removeRole(roleId: string): void {
    this._roles = this._roles.filter((r) => r.id !== roleId);
    this.touch();
  }

  async changePassword(newPlainPassword: string): Promise<void> {
    this._passwordHash = await PasswordHash.create(newPlainPassword);
    this.touch();
  }

  updateDisplayName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Display name cannot be empty');
    }
    this._displayName = name.trim();
    this.touch();
  }
}
