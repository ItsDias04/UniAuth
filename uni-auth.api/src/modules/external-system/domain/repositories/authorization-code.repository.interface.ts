import { AuthorizationCode } from '../entities/authorization-code.entity';

export const AUTHORIZATION_CODE_REPOSITORY = Symbol('AUTHORIZATION_CODE_REPOSITORY');

/**
 * Интерфейс репозитория — коды авторизации OAuth2.
 */
export interface IAuthorizationCodeRepository {
  save(code: AuthorizationCode): Promise<void>;
  findByCodeHash(codeHash: string): Promise<AuthorizationCode | null>;
  findById(id: string): Promise<AuthorizationCode | null>;
  deleteExpired(): Promise<number>;
}
