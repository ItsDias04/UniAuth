
import { AggregateRoot } from '../../../../common/domain';

export type ClientApplicationStatus = 'IpVerificationPending' | 'NeedsAddRoute' | 'active' | 'inactive' | 'production';

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

  private constructor(props: {
    id: string;
    ownerUserId: string;
    name: string;
    redirectRoute: string;
    status: ClientApplicationStatus;
    ip : string;
  }) {
    super(props.id);
    this._ownerUserId = props.ownerUserId;
    this._name = props.name;
    this._redirectRoute = props.redirectRoute;
    this._status = props.status;
    this._ip = props.ip;
  }

  static create(props: {
    id: string;
    ownerUserId: string;
    name: string;
    redirectRoute?: string;
  }): ClientApplication {
    return new ClientApplication({
      ...props,
      redirectRoute: props.redirectRoute ?? '',
      status: 'IpVerificationPending',
      ip: '',
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
  }): ClientApplication {
    const app = new ClientApplication(props);
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
    this.touch();
  }

  updateSettings(props: {
    name?: string;
    redirectRoute?: string;
  }): void {
    if (props.name !== undefined) {
      this._name = props.name;
    }

    if (props.redirectRoute !== undefined) {
      this._redirectRoute = props.redirectRoute;
      this._status = 'IpVerificationPending';
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
