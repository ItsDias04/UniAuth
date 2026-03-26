import { Session } from '../entities/session.entity';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export interface ISessionRepository {
  findById(id: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  findActiveByUserId(userId: string): Promise<Session[]>;
  save(session: Session): Promise<void>;
  delete(id: string): Promise<void>;
  revokeAllByUserId(userId: string): Promise<void>;
}
