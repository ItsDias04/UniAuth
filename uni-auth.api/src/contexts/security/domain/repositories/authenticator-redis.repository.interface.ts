export const AUTHENTICATOR_REDIS_REPOSITORY = Symbol('AUTHENTICATOR_REDIS_REPOSITORY');

export interface AuthenticatorPendingLoginState {
  loginAttemptId: string;
  userId: string;
  email: string;
  emailCode: string;
  deviceName: string;
  deviceFingerprint: string;
}

export interface IAuthenticatorRedisRepository {
  savePendingLogin(
    state: AuthenticatorPendingLoginState,
    ttlSeconds: number,
  ): Promise<void>;
  findPendingLogin(loginAttemptId: string): Promise<AuthenticatorPendingLoginState | null>;
  deletePendingLogin(loginAttemptId: string): Promise<void>;
}
