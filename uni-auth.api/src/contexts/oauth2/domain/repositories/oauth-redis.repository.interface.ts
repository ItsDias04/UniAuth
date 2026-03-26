export const OAUTH_REDIS_REPOSITORY = Symbol('OAUTH_REDIS_REPOSITORY');

export interface OAuthAuthorizationCodeRecord {
  authCode: string;
  userId: string;
  clientId: string;
}

export interface IOAuthRedisRepository {
  saveAuthorizationCode(
    record: OAuthAuthorizationCodeRecord,
    ttlSeconds: number,
  ): Promise<void>;
  consumeAuthorizationCode(authCode: string): Promise<OAuthAuthorizationCodeRecord | null>;
}
