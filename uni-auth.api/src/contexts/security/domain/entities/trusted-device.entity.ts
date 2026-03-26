import { AggregateRoot } from '../../../../common/domain';

/**
 * TrustedDevice aggregate for authenticator app device binding.
 */
export class TrustedDevice extends AggregateRoot<string> {
  private _userId: string;
  private _deviceName: string;
  private _deviceFingerprint: string;
  private _secret: string;
  private _isActive: boolean;

  private constructor(props: {
    id: string;
    userId: string;
    deviceName: string;
    deviceFingerprint: string;
    secret: string;
    isActive: boolean;
  }) {
    super(props.id);
    this._userId = props.userId;
    this._deviceName = props.deviceName;
    this._deviceFingerprint = props.deviceFingerprint;
    this._secret = props.secret;
    this._isActive = props.isActive;
  }

  static register(props: {
    id: string;
    userId: string;
    deviceName: string;
    deviceFingerprint: string;
    secret: string;
  }): TrustedDevice {
    return new TrustedDevice({
      ...props,
      isActive: true,
    });
  }

  get userId(): string {
    return this._userId;
  }

  get deviceName(): string {
    return this._deviceName;
  }

  get deviceFingerprint(): string {
    return this._deviceFingerprint;
  }

  get secret(): string {
    return this._secret;
  }

  get isActive(): boolean {
    return this._isActive;
  }
}
