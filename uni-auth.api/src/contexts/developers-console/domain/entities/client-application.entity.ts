import { AggregateRoot } from '../../../../common/domain';

export type ClientApplicationStatus =
  | 'draft'
  | 'IpVerificationPending'
  | 'NeedsAddRoute'
  | 'active'
  | 'inactive'
  | 'production';

/**
 * Developer-owned client application used for SSO integrations.
 * Stores redirect route and verified IP addresses.
 */
export class ClientApplication extends AggregateRoot<string> {
  private _ownerUserId: string;
  private _name: string;
  private _redirectRoute: string;
  private _status: ClientApplicationStatus;
  private _ip: string;
  private _ipIsVerified: boolean = false;
  private _apiTokenHash: string | null = null;

  private constructor(props: {
    id: string;
    ownerUserId: string;
    name: string;
    redirectRoute: string;
    status: ClientApplicationStatus;
    ip: string;
    apiTokenHash?: string | null;
  }) {
    super(props.id);
    this._ownerUserId = props.ownerUserId;
    this._name = props.name;
    this._redirectRoute = props.redirectRoute;
    this._status = props.status;
    this._ip = props.ip;
    this._apiTokenHash = props.apiTokenHash ?? null;
  }

  static create(props: {
    id: string;
    ownerUserId: string;
    name: string;
    redirectRoute?: string;
    apiTokenHash?: string | null;
  }): ClientApplication {
    return new ClientApplication({
      ...props,
      redirectRoute: props.redirectRoute ?? '',
      status: 'IpVerificationPending',
      ip: '',
      apiTokenHash: props.apiTokenHash ?? null,
    });
  }

  static reconstitute(props: {
    id: string;
    ownerUserId: string;
    name: string;
    redirectRoute: string;
    status: ClientApplicationStatus;
    createdAt?: Date;
    updatedAt?: Date;
    ip: string;
    ipIsVerified: boolean;
    apiTokenHash?: string | null;
  }): ClientApplication {
    const app = new ClientApplication(props);
    app._ipIsVerified = props.ipIsVerified;
    app._apiTokenHash = props.apiTokenHash ?? null;
    if (props.createdAt) app._createdAt = props.createdAt;
    if (props.updatedAt) app._updatedAt = props.updatedAt;
    return app;
  }

  verifyIp(ip: string): void {
    if (this.redirectRoute === '') {
      this._status = 'NeedsAddRoute';
    } else {
      this._status = 'active';
    }
    this._ipIsVerified = true;
    this.touch();
  }

  updateSettings(props: { name?: string; redirectRoute?: string }): void {
    if (props.redirectRoute !== undefined) {
      this._redirectRoute = props.redirectRoute;
      // this._status = 'IpVerificationPending';
    }
    if (this.ipIsVerified) {
      if (this.redirectRoute === '') {
        this._status = 'NeedsAddRoute';
      } else {
        this._status = 'active';
      }
    }

    this.touch();
  }

  setIp(ip: string): void {
    this._ip = ip;
    this._ipIsVerified = false;
    this.touch();
  }

  setRoute(route: string): void {
    this._redirectRoute = route;
    this.touch();
  }

  setApiTokenHash(apiTokenHash: string): void {
    this._apiTokenHash = apiTokenHash;
    this.touch();
  }

  clearApiToken(): void {
    this._apiTokenHash = null;
    this.touch();
  }

  get ownerUserId(): string {
    return this._ownerUserId;
  }

  get name(): string {
    return this._name;
  }

  get redirectRoute(): string {
    return this._redirectRoute;
  }

  get ip(): string {
    return this._ip;
  }

  get ipIsVerified(): boolean {
    return this._ipIsVerified;
  }

  get apiTokenHash(): string | null {
    return this._apiTokenHash;
  }

  get hasApiToken(): boolean {
    return !!this._apiTokenHash;
  }

  get status(): ClientApplicationStatus {
    return this._status;
  }

  get isActive(): boolean {
    return this._status === 'active' || this._status === 'production';
  }

  launchToProduction(): void {
    if (this._status !== 'active' && this._status !== 'production') {
      throw new Error('Application must be active to launch to production');
    }
    this._status = 'production';
    this.touch();
  }

  toggleStatus(): void {
    if (this._status === 'production' || this._status === 'active') {
      this._status = 'inactive';
    } else if (this._status === 'inactive') {
      this._status = 'active';
    }
    this.touch();
  }

  markIpAsVerified(): void {
    this._ipIsVerified = true;
    this.touch();
  }
}
