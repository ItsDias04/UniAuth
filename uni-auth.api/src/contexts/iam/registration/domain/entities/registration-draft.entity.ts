import { AggregateRoot } from '../../../../../common/domain';

export class RegistrationDraft extends AggregateRoot<string> {
  private _login: string;
  private _password: string;
  private _firstName: string;
  private _lastName: string;
  private _phone: string;
  private _email: string;
  private _emailCode: string;
  private _whatsAppCode: string | null;
  private _tempToken: string | null;
  private _emailVerified: boolean;

  private constructor(props: {
    id: string;
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    emailCode: string;
    whatsAppCode: string | null;
    tempToken: string | null;
    emailVerified: boolean;
  }) {
    super(props.id);
    this._login = props.login;
    this._password = props.password;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._phone = props.phone;
    this._email = props.email;
    this._emailCode = props.emailCode;
    this._whatsAppCode = props.whatsAppCode;
    this._tempToken = props.tempToken;
    this._emailVerified = props.emailVerified;
  }

  static initiate(props: {
    id: string;
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    emailCode: string;
  }): RegistrationDraft {
    return new RegistrationDraft({
      ...props,
      whatsAppCode: null,
      tempToken: null,
      emailVerified: false,
    });
  }

  static reconstitute(props: {
    id: string;
    login: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    emailCode: string;
    whatsAppCode: string | null;
    tempToken: string | null;
    emailVerified: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): RegistrationDraft {
    const draft = new RegistrationDraft(props);
    if (props.createdAt) draft._createdAt = props.createdAt;
    if (props.updatedAt) draft._updatedAt = props.updatedAt;
    return draft;
  }

  verifyEmail(inputCode: string, tempToken: string, whatsAppCode: string): void {
    if (this._emailCode !== inputCode) {
      throw new Error('Invalid email verification code');
    }
    this._emailVerified = true;
    this._tempToken = tempToken;
    this._whatsAppCode = whatsAppCode;
    this.touch();
  }

  verifyWhatsApp(inputTempToken: string, inputCode: string): void {
    if (!this._emailVerified) {
      throw new Error('Email is not verified');
    }
    if (!this._tempToken || this._tempToken !== inputTempToken) {
      throw new Error('Invalid temporary token');
    }
    if (!this._whatsAppCode || this._whatsAppCode !== inputCode) {
      throw new Error('Invalid WhatsApp verification code');
    }
    this.touch();
  }

  toPrimitives() {
    return {
      registrationId: this.id,
      login: this._login,
      password: this._password,
      firstName: this._firstName,
      lastName: this._lastName,
      phone: this._phone,
      email: this._email,
      emailCode: this._emailCode,
      whatsAppCode: this._whatsAppCode,
      tempToken: this._tempToken,
      emailVerified: this._emailVerified,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  get login(): string { return this._login; }
  get password(): string { return this._password; }
  get firstName(): string { return this._firstName; }
  get lastName(): string { return this._lastName; }
  get phone(): string { return this._phone; }
  get email(): string { return this._email; }
  get emailCode(): string { return this._emailCode; }
  get whatsAppCode(): string | null { return this._whatsAppCode; }
  get tempToken(): string | null { return this._tempToken; }
}
