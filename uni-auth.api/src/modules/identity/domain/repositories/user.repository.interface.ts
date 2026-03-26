import { User } from '../entities/user.entity';

/**
 * Repository Interface — порт для персистентности пользователей.
 * Определён в Domain слое, реализуется в Infrastructure.
 */
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(page: number, limit: number): Promise<{ users: User[]; total: number }>;
  existsByEmail(email: string): Promise<boolean>;
}
