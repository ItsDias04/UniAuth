import { randomBytes, createHash } from 'crypto';

/**
 * Value Object — учётные данные OAuth2 клиента.
 * Генерирует client_id и client_secret, хранит хеш секрета.
 */
export class ClientCredentials {
  private constructor(
    private readonly _clientId: string,
    private readonly _clientSecretHash: string,
  ) {}

  /**
   * Генерация новых учётных данных.
   * Возвращает объект + открытый секрет (показывается один раз).
   */
  static generate(): { credentials: ClientCredentials; plainSecret: string } {
    const clientId = `ua_${randomBytes(16).toString('hex')}`;
    const plainSecret = randomBytes(32).toString('hex');
    const secretHash = createHash('sha256').update(plainSecret).digest('hex');

    return {
      credentials: new ClientCredentials(clientId, secretHash),
      plainSecret,
    };
  }

  /**
   * Восстановление из persistence.
   */
  static reconstitute(clientId: string, clientSecretHash: string): ClientCredentials {
    return new ClientCredentials(clientId, clientSecretHash);
  }

  /**
   * Проверка секрета.
   */
  verifySecret(plainSecret: string): boolean {
    const hash = createHash('sha256').update(plainSecret).digest('hex');
    return hash === this._clientSecretHash;
  }

  get clientId(): string {
    return this._clientId;
  }

  get clientSecretHash(): string {
    return this._clientSecretHash;
  }

  equals(other: ClientCredentials): boolean {
    return this._clientId === other._clientId;
  }
}
