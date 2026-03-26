import { LoginAttempt } from '../entities/login-attempt.entity';

export const LOGIN_ATTEMPT_REPOSITORY = Symbol('LOGIN_ATTEMPT_REPOSITORY');

export interface ILoginAttemptRepository {
  save(attempt: LoginAttempt): Promise<void>;
  countRecentByIp(ip: string, windowMinutes: number): Promise<number>;
  countRecentByEmail(email: string, windowMinutes: number): Promise<number>;
  findRecentByUserId(userId: string, limit: number): Promise<LoginAttempt[]>;
}
