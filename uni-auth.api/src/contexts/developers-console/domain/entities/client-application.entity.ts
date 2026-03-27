import { AggregateRoot } from '../../../../common/domain';

/**
 * Developer-owned client application used for SSO integrations.
 * Stores redirect route and verified IP addresses.
 */
export class ClientApplication extends AggregateRoot<string> {
  private _ownerUserId: string;
  private _name: string;
  private _redirectRoute: string;
  private _verifiedIps: Set<string>;

  private constructor(props: {
    id: string;
    ownerUserId: string;
    name: string;
    redirectRoute: string;
    verifiedIps?: string[];
  }) {
    super(props.id);
    this._ownerUserId = props.ownerUserId;
    this._name = props.name;
    this._redirectRoute = props.redirectRoute;
    this._verifiedIps = new Set(props.verifiedIps ?? []);
  }

  static create(props: {
    id: string;
    ownerUserId: string;
    name: string;
    redirectRoute: string;
  }): ClientApplication {
    return new ClientApplication({
      ...props,
      verifiedIps: [],
    });
  }

  static reconstitute(props: {
    id: string;
    ownerUserId: string;
    name: string;
    redirectRoute: string;
    verifiedIps: string[];
    createdAt?: Date;
    updatedAt?: Date;
  }): ClientApplication {
    const app = new ClientApplication(props);
    if (props.createdAt) app._createdAt = props.createdAt;
    if (props.updatedAt) app._updatedAt = props.updatedAt;
    return app;
  }

  verifyIp(ip: string): void {
    this._verifiedIps.add(ip);
    this.touch();
  }

  get isVerifiedForAnyIp(): boolean {
    return this._verifiedIps.size > 0;
  }

  hasVerifiedIp(ip: string): boolean {
    return this._verifiedIps.has(ip);
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

  get verifiedIps(): string[] {
    return Array.from(this._verifiedIps);
  }
}
