/**
 * Value Object — тип гранта OAuth2.
 * Определяет допустимые типы авторизации для внешнего клиента.
 */
export enum GrantType {
  AUTHORIZATION_CODE = 'authorization_code',
  CLIENT_CREDENTIALS = 'client_credentials',
  REFRESH_TOKEN = 'refresh_token',
}

export class GrantTypeVO {
  private constructor(private readonly _value: GrantType) {}

  static create(value: string): GrantTypeVO {
    if (!Object.values(GrantType).includes(value as GrantType)) {
      throw new Error(`Недопустимый тип гранта: ${value}. Допустимые: ${Object.values(GrantType).join(', ')}`);
    }
    return new GrantTypeVO(value as GrantType);
  }

  get value(): GrantType {
    return this._value;
  }

  equals(other: GrantTypeVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
