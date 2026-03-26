import { AggregateRoot } from '../../../../common/domain';
import { ClientCredentials } from '../value-objects/client-credentials.vo';
import { GrantType } from '../value-objects/grant-type.vo';
import { RedirectUri } from '../value-objects/redirect-uri.vo';
import { ClientRegisteredEvent } from '../events/client-registered.event';
import { ClientRevokedEvent } from '../events/client-revoked.event';

export enum ClientStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  SUSPENDED = 'suspended',
}

/**
 * Aggregate Root — OAuth2 клиент (внешняя система).
 *
 * Представляет зарегистрированное внешнее приложение,
 * которое может интегрироваться с UniAuth по протоколу OAuth2.
 *
 * Инварианты:
 * - client_id уникален
 * - должен иметь хотя бы один redirect_uri
 * - должен иметь хотя бы один разрешённый grant_type
 * - отозванный клиент не может выполнять авторизацию
 */
export class ExternalClient extends AggregateRoot<string> {
  private _name: string;
  private _description: string;
  private _credentials: ClientCredentials;
  private _redirectUris: RedirectUri[];
  private _allowedGrantTypes: GrantType[];
  private _allowedScopes: string[];
  private _status: ClientStatus;
  private _ownerId: string;
  private _homepageUrl: string | null;
  private _logoUrl: string | null;

  private constructor(
    id: string,
    name: string,
    description: string,
    credentials: ClientCredentials,
    redirectUris: RedirectUri[],
    allowedGrantTypes: GrantType[],
    allowedScopes: string[],
    status: ClientStatus,
    ownerId: string,
    homepageUrl: string | null,
    logoUrl: string | null,
  ) {
    super(id);
    this._name = name;
    this._description = description;
    this._credentials = credentials;
    this._redirectUris = redirectUris;
    this._allowedGrantTypes = allowedGrantTypes;
    this._allowedScopes = allowedScopes;
    this._status = status;
    this._ownerId = ownerId;
    this._homepageUrl = homepageUrl;
    this._logoUrl = logoUrl;
  }

  /**
   * Factory method — регистрация нового OAuth2 клиента.
   */
  static register(props: {
    id: string;
    name: string;
    description: string;
    redirectUris: string[];
    allowedGrantTypes: string[];
    allowedScopes: string[];
    ownerId: string;
    homepageUrl?: string;
    logoUrl?: string;
  }): { client: ExternalClient; plainSecret: string } {
    if (!props.redirectUris || props.redirectUris.length === 0) {
      throw new Error('Необходимо указать хотя бы один redirect_uri');
    }
    if (!props.allowedGrantTypes || props.allowedGrantTypes.length === 0) {
      throw new Error('Необходимо указать хотя бы один grant_type');
    }

    const { credentials, plainSecret } = ClientCredentials.generate();
    const redirectUris = props.redirectUris.map((uri) => RedirectUri.create(uri));
    const allowedGrantTypes = props.allowedGrantTypes.map(
      (gt) => GrantType[gt.toUpperCase().replace(/ /g, '_') as keyof typeof GrantType] ?? gt,
    ) as GrantType[];

    const client = new ExternalClient(
      props.id,
      props.name,
      props.description,
      credentials,
      redirectUris,
      allowedGrantTypes,
      props.allowedScopes || ['openid', 'profile', 'email'],
      ClientStatus.ACTIVE,
      props.ownerId,
      props.homepageUrl || null,
      props.logoUrl || null,
    );

    client.addDomainEvent(
      new ClientRegisteredEvent(
        credentials.clientId,
        props.id,
        props.name,
        props.ownerId,
      ),
    );

    return { client, plainSecret };
  }

  /**
   * Восстановление из persistence.
   */
  static reconstitute(props: {
    id: string;
    name: string;
    description: string;
    clientId: string;
    clientSecretHash: string;
    redirectUris: string[];
    allowedGrantTypes: string[];
    allowedScopes: string[];
    status: ClientStatus;
    ownerId: string;
    homepageUrl: string | null;
    logoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ExternalClient {
    const credentials = ClientCredentials.reconstitute(
      props.clientId,
      props.clientSecretHash,
    );
    const redirectUris = props.redirectUris.map((uri) => RedirectUri.create(uri));

    const client = new ExternalClient(
      props.id,
      props.name,
      props.description,
      credentials,
      redirectUris,
      props.allowedGrantTypes as GrantType[],
      props.allowedScopes,
      props.status,
      props.ownerId,
      props.homepageUrl,
      props.logoUrl,
    );

    client._createdAt = props.createdAt;
    client._updatedAt = props.updatedAt;
    return client;
  }

  /**
   * Проверка client_secret.
   */
  verifySecret(plainSecret: string): boolean {
    return this._credentials.verifySecret(plainSecret);
  }

  /**
   * Проверка redirect_uri.
   */
  isRedirectUriAllowed(uri: string): boolean {
    return this._redirectUris.some((u) => u.value === uri);
  }

  /**
   * Проверка grant_type.
   */
  isGrantTypeAllowed(grantType: string): boolean {
    return this._allowedGrantTypes.includes(grantType as GrantType);
  }

  /**
   * Проверка scope.
   */
  areScopesAllowed(scopes: string[]): boolean {
    return scopes.every((s) => this._allowedScopes.includes(s));
  }

  /**
   * Отзыв клиента.
   */
  revoke(revokedByUserId: string, reason: string): void {
    if (this._status === ClientStatus.REVOKED) {
      throw new Error('Клиент уже отозван');
    }
    this._status = ClientStatus.REVOKED;
    this.touch();
    this.addDomainEvent(
      new ClientRevokedEvent(this._id, this._credentials.clientId, revokedByUserId, reason),
    );
  }

  /**
   * Обновление метаданных клиента.
   */
  update(props: {
    name?: string;
    description?: string;
    redirectUris?: string[];
    allowedScopes?: string[];
    homepageUrl?: string;
    logoUrl?: string;
  }): void {
    if (this._status === ClientStatus.REVOKED) {
      throw new Error('Невозможно обновить отозванного клиента');
    }
    if (props.name) this._name = props.name;
    if (props.description !== undefined) this._description = props.description;
    if (props.redirectUris) {
      this._redirectUris = props.redirectUris.map((uri) => RedirectUri.create(uri));
    }
    if (props.allowedScopes) this._allowedScopes = props.allowedScopes;
    if (props.homepageUrl !== undefined) this._homepageUrl = props.homepageUrl;
    if (props.logoUrl !== undefined) this._logoUrl = props.logoUrl;
    this.touch();
  }

  // --- Getters ---
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get clientId(): string { return this._credentials.clientId; }
  get clientSecretHash(): string { return this._credentials.clientSecretHash; }
  get redirectUris(): string[] { return this._redirectUris.map((u) => u.value); }
  get allowedGrantTypes(): string[] { return [...this._allowedGrantTypes]; }
  get allowedScopes(): string[] { return [...this._allowedScopes]; }
  get status(): ClientStatus { return this._status; }
  get ownerId(): string { return this._ownerId; }
  get homepageUrl(): string | null { return this._homepageUrl; }
  get logoUrl(): string | null { return this._logoUrl; }
  get isActive(): boolean { return this._status === ClientStatus.ACTIVE; }
}
