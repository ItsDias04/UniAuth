export const AUTH_SESSION_REPOSITORY = Symbol('AUTH_SESSION_REPOSITORY');

export interface CreateAuthSessionInput {
  id: string;
  userId: string;
  refreshTokenHash: string;
  refreshTokenExpiresAt: Date;
}

export interface IAuthSessionRepository {
  create(input: CreateAuthSessionInput): Promise<void>;
}
