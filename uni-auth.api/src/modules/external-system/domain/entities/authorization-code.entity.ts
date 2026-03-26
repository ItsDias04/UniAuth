import { BaseEntity } from '../../../../common/domain';
import { randomBytes, createHash } from 'crypto';

/**
 * Entity — код авторизации OAuth2 (Authorization Code).
 *
 * Короткоживущий одноразовый код, выдаваемый после
 * успешной авторизации пользователя для обмена на токены.
 * Поддерживает PKCE (Proof Key for Code Exchange).
 */
export class AuthorizationCode extends BaseEntity<string> {
  private _code: string;
  private _codeHash: string;
  private _clientDbId: string;
  private _userId: string;
  private _redirectUri: string;
  private _scopes: string[];
  private _codeChallenge: string | null;
  private _codeChallengeMethod: string | null;
  private _expiresAt: Date;
  private _used: boolean;

  private constructor(
    id: string,
    code: string,
    codeHash: string,
    clientDbId: string,
    userId: string,
    redirectUri: string,
    scopes: string[],
    codeChallenge: string | null,
    codeChallengeMethod: string | null,
    expiresAt: Date,
    used: boolean,
  ) {
    super(id);
    this._code = code;
    this._codeHash = codeHash;
    this._clientDbId = clientDbId;
    this._userId = userId;
    this._redirectUri = redirectUri;
    this._scopes = scopes;
    this._codeChallenge = codeChallenge;
    this._codeChallengeMethod = codeChallengeMethod;
    this._expiresAt = expiresAt;
    this._used = used;
  }

  /**
   * Factory — создание нового кода авторизации.
   * Код живёт 10 минут по умолчанию.
   */
  static create(props: {
    id: string;
    clientDbId: string;
    userId: string;
    redirectUri: string;
    scopes: string[];
    codeChallenge?: string;
    codeChallengeMethod?: string;
    ttlSeconds?: number;
  }): { authCode: AuthorizationCode; plainCode: string } {
    const plainCode = randomBytes(32).toString('hex');
    const codeHash = createHash('sha256').update(plainCode).digest('hex');
    const ttl = props.ttlSeconds || 600; // 10 минут
    const expiresAt = new Date(Date.now() + ttl * 1000);

    const authCode = new AuthorizationCode(
      props.id,
      plainCode,
      codeHash,
      props.clientDbId,
      props.userId,
      props.redirectUri,
      props.scopes,
      props.codeChallenge || null,
      props.codeChallengeMethod || null,
      expiresAt,
      false,
    );

    return { authCode, plainCode };
  }

  /**
   * Восстановление из persistence.
   */
  static reconstitute(props: {
    id: string;
    codeHash: string;
    clientDbId: string;
    userId: string;
    redirectUri: string;
    scopes: string[];
    codeChallenge: string | null;
    codeChallengeMethod: string | null;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
  }): AuthorizationCode {
    const ac = new AuthorizationCode(
      props.id,
      '', // plain code не хранится
      props.codeHash,
      props.clientDbId,
      props.userId,
      props.redirectUri,
      props.scopes,
      props.codeChallenge,
      props.codeChallengeMethod,
      props.expiresAt,
      props.used,
    );
    ac._createdAt = props.createdAt;
    return ac;
  }

  /**
   * Обмен кода — помечает как использованный.
   */
  exchange(plainCode: string, redirectUri: string, codeVerifier?: string): void {
    if (this._used) {
      throw new Error('Код авторизации уже использован');
    }
    if (new Date() > this._expiresAt) {
      throw new Error('Код авторизации истёк');
    }

    const hash = createHash('sha256').update(plainCode).digest('hex');
    if (hash !== this._codeHash) {
      throw new Error('Некорректный код авторизации');
    }

    if (this._redirectUri !== redirectUri) {
      throw new Error('redirect_uri не совпадает');
    }

    // Проверка PKCE
    if (this._codeChallenge) {
      if (!codeVerifier) {
        throw new Error('Требуется code_verifier для PKCE');
      }
      const computedChallenge =
        this._codeChallengeMethod === 'S256'
          ? createHash('sha256').update(codeVerifier).digest('base64url')
          : codeVerifier;

      if (computedChallenge !== this._codeChallenge) {
        throw new Error('Некорректный code_verifier (PKCE)');
      }
    }

    this._used = true;
    this.touch();
  }

  get isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  // --- Getters ---
  get code(): string { return this._code; }
  get codeHash(): string { return this._codeHash; }
  get clientDbId(): string { return this._clientDbId; }
  get userId(): string { return this._userId; }
  get redirectUri(): string { return this._redirectUri; }
  get scopes(): string[] { return [...this._scopes]; }
  get codeChallenge(): string | null { return this._codeChallenge; }
  get codeChallengeMethod(): string | null { return this._codeChallengeMethod; }
  get expiresAt(): Date { return this._expiresAt; }
  get used(): boolean { return this._used; }
}
