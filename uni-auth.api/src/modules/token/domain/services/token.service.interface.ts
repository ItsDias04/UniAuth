/**
 * Domain Service Interface — Token Service.
 * Определяет контракт для выпуска, проверки и отзыва токенов.
 *
 * Поддерживает:
 * - OAuth 2.0 Access Token
 * - Refresh Token с rotation
 * - OpenID Connect ID Token
 */

export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  [key: string]: any;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn: number;
  tokenType: string;
}

export interface ITokenService {
  /**
   * Выпуск пары токенов (access + refresh).
   */
  issueTokenPair(payload: TokenPayload): Promise<TokenPair>;

  /**
   * Обновление access token по refresh token (с rotation).
   */
  refreshTokens(refreshToken: string): Promise<TokenPair>;

  /**
   * Отзыв refresh token.
   */
  revokeRefreshToken(refreshToken: string): Promise<void>;

  /**
   * Отзыв всех refresh tokens пользователя.
   */
  revokeAllUserTokens(userId: string): Promise<void>;

  /**
   * Валидация access token.
   */
  verifyAccessToken(token: string): Promise<TokenPayload>;
}
