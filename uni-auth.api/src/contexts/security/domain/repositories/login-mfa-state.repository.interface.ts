export const LOGIN_MFA_STATE_REPOSITORY = Symbol('LOGIN_MFA_STATE_REPOSITORY');

export interface LoginMfaState {
  mfaToken: string;
  userId: string;
  email: string;
  code: string;
}

export interface ILoginMfaStateRepository {
  save(state: LoginMfaState, ttlSeconds: number): Promise<void>;
  findByToken(mfaToken: string): Promise<LoginMfaState | null>;
  deleteByToken(mfaToken: string): Promise<void>;
}
