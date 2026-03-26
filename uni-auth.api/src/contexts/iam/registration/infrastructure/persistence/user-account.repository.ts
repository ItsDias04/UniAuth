import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAccountOrmEntity } from './user-account.orm-entity';
import {
  IUserAccountRepository,
  UserAccountAuthView,
  UserAccountProfileView,
} from '../../domain/repositories/user-account.repository.interface';
import { UserAccount } from '../../domain/entities/user-account.entity';

@Injectable()
export class UserAccountRepository implements IUserAccountRepository {
  constructor(
    @InjectRepository(UserAccountOrmEntity)
    private readonly repository: Repository<UserAccountOrmEntity>,
  ) {}

  async save(user: UserAccount): Promise<void> {
    await this.repository.save({
      id: user.id,
      login: user.login,
      passwordHash: user.passwordHash,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email.toString(),
      avatarUrl: user.avatarUrl,
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { email: email.toLowerCase().trim() },
    });
    return count > 0;
  }

  async existsByLogin(login: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { login: login.trim() },
    });
    return count > 0;
  }

  async findAuthByEmail(email: string): Promise<UserAccountAuthView | null> {
    const row = await this.repository.findOne({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!row) return null;

    return {
      userId: row.id,
      email: row.email,
      passwordHash: row.passwordHash,
    };
  }

  async findProfileById(userId: string): Promise<UserAccountProfileView | null> {
    const row = await this.repository.findOne({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
      },
    });

    if (!row) return null;

    return {
      userId: row.id,
      email: row.email,
      firstName: row.firstName,
      lastName: row.lastName,
      avatarUrl: row.avatarUrl,
    };
  }
}
