import { AggregateRoot, Email } from '../../../../../common/domain';

export class UserAccount extends AggregateRoot<string> {
  private _login: string;
  private _passwordHash: string;
  private _firstName: string;
  private _lastName: string;
  private _phone: string;
  private _email: Email;
  private _avatarUrl: string | null;

  private constructor(props: {
    id: string;
    login: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: Email;
    avatarUrl: string | null;
  }) {
    super(props.id);
    this._login = props.login;
    this._passwordHash = props.passwordHash;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._phone = props.phone;
    this._email = props.email;
    this._avatarUrl = props.avatarUrl;
  }

  static register(props: {
    id: string;
    login: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    avatarUrl?: string | null;
  }): UserAccount {
    return new UserAccount({
      id: props.id,
      login: props.login,
      passwordHash: props.passwordHash,
      firstName: props.firstName,
      lastName: props.lastName,
      phone: props.phone,
      email: Email.create(props.email),
      avatarUrl: props.avatarUrl ?? null,
    });
  }

  get login(): string { return this._login; }
  get passwordHash(): string { return this._passwordHash; }
  get firstName(): string { return this._firstName; }
  get lastName(): string { return this._lastName; }
  get phone(): string { return this._phone; }
  get email(): Email { return this._email; }
  get avatarUrl(): string | null { return this._avatarUrl; }
}
