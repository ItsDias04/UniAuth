import { UserAccount } from '../entities/user-account.entity';

export const USER_ACCOUNT_REPOSITORY = Symbol('USER_ACCOUNT_REPOSITORY');

export interface UserAccountAuthView {
  userId: string;
  email: string;
  passwordHash: string;
}

export interface UserAccountProfileView {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface IUserAccountRepository {
  save(user: UserAccount): Promise<void>;
  existsByEmail(email: string): Promise<boolean>;
  existsByLogin(login: string): Promise<boolean>;
  findAuthByEmail(email: string): Promise<UserAccountAuthView | null>;
  findProfileById(userId: string): Promise<UserAccountProfileView | null>;
}
