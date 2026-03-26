import { AggregateRoot } from '../../../../common/domain';
import { MfaType } from '../value-objects/mfa-type.vo';
import { MfaEnabledEvent } from '../events/mfa-enabled.event';

/**
 * Aggregate Root — MFA устройство пользователя.
 * Представляет зарегистрированный второй фактор (TOTP, SMS и т.д.).
 *
 * Инварианты:
 * - secret хранится зашифрованным
 * - устройство можно деактивировать
 * - backup codes генерируются при создании TOTP
 */
export class MfaDevice extends AggregateRoot<string> {
  private _userId: string;
  private _type: MfaType;
  private _secret: string; // TOTP secret or phone/email for SMS/EMAIL
  private _label: string;
  private _isActive: boolean;
  private _isVerified: boolean;
  private _backupCodes: string[];
  private _lastUsedAt: Date | null;

  private constructor(
    id: string,
    userId: string,
    type: MfaType,
    secret: string,
    label: string,
    isActive: boolean,
    isVerified: boolean,
    backupCodes: string[],
    lastUsedAt: Date | null,
  ) {
    super(id);
    this._userId = userId;
    this._type = type;
    this._secret = secret;
    this._label = label;
    this._isActive = isActive;
    this._isVerified = isVerified;
    this._backupCodes = backupCodes;
    this._lastUsedAt = lastUsedAt;
  }

  /**
   * Factory — создание нового TOTP устройства.
   */
  static createTotp(
    id: string,
    userId: string,
    secret: string,
    label: string,
    backupCodes: string[],
  ): MfaDevice {
    const device = new MfaDevice(
      id,
      userId,
      MfaType.TOTP,
      secret,
      label,
      true,
      false, // не подтверждено до первого успешного ввода кода
      backupCodes,
      null,
    );
    device.addDomainEvent(new MfaEnabledEvent(userId, MfaType.TOTP, id));
    return device;
  }

  /**
   * Factory — создание SMS MFA.
   */
  static createSms(
    id: string,
    userId: string,
    phoneNumber: string,
  ): MfaDevice {
    return new MfaDevice(
      id,
      userId,
      MfaType.SMS,
      phoneNumber,
      `SMS: ${phoneNumber.slice(-4)}`,
      true,
      false,
      [],
      null,
    );
  }

  /**
   * Factory — создание Email MFA.
   */
  static createEmail(
    id: string,
    userId: string,
    email: string,
  ): MfaDevice {
    return new MfaDevice(
      id,
      userId,
      MfaType.EMAIL,
      email,
      `Email: ${email}`,
      true,
      false,
      [],
      null,
    );
  }

  static reconstitute(props: {
    id: string;
    userId: string;
    type: MfaType;
    secret: string;
    label: string;
    isActive: boolean;
    isVerified: boolean;
    backupCodes: string[];
    lastUsedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): MfaDevice {
    const device = new MfaDevice(
      props.id,
      props.userId,
      props.type,
      props.secret,
      props.label,
      props.isActive,
      props.isVerified,
      props.backupCodes,
      props.lastUsedAt,
    );
    device._createdAt = props.createdAt;
    device._updatedAt = props.updatedAt;
    return device;
  }

  // Getters
  get userId(): string { return this._userId; }
  get type(): MfaType { return this._type; }
  get secret(): string { return this._secret; }
  get label(): string { return this._label; }
  get isActive(): boolean { return this._isActive; }
  get isVerified(): boolean { return this._isVerified; }
  get backupCodes(): ReadonlyArray<string> { return [...this._backupCodes]; }
  get lastUsedAt(): Date | null { return this._lastUsedAt; }

  // Domain logic
  verify(): void {
    this._isVerified = true;
    this.touch();
  }

  deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  recordUsage(): void {
    this._lastUsedAt = new Date();
    this.touch();
  }

  /**
   * Использовать backup code (одноразовый).
   */
  useBackupCode(code: string): boolean {
    const index = this._backupCodes.indexOf(code);
    if (index === -1) return false;
    this._backupCodes.splice(index, 1);
    this.touch();
    return true;
  }
}
