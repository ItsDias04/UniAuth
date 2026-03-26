import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { ILoginAttemptRepository } from '../../domain/repositories/login-attempt.repository.interface';
import {
  LoginAttempt,
  LoginAttemptStatus,
} from '../../domain/entities/login-attempt.entity';
import { LoginAttemptOrmEntity } from './login-attempt.orm-entity';

@Injectable()
export class LoginAttemptRepository implements ILoginAttemptRepository {
  constructor(
    @InjectRepository(LoginAttemptOrmEntity)
    private readonly ormRepo: Repository<LoginAttemptOrmEntity>,
  ) {}

  async save(attempt: LoginAttempt): Promise<void> {
    await this.ormRepo.save({
      id: attempt.id,
      email: attempt.email,
      ip: attempt.ip,
      userAgent: attempt.userAgent,
      status: attempt.status,
      userId: attempt.userId,
    });
  }

  async countRecentByIp(ip: string, windowMinutes: number): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.ormRepo.count({
      where: {
        ip,
        createdAt: MoreThan(since),
        status: 'failed_credentials' as any,
      },
    });
  }

  async countRecentByEmail(
    email: string,
    windowMinutes: number,
  ): Promise<number> {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    return this.ormRepo.count({
      where: {
        email,
        createdAt: MoreThan(since),
        status: 'failed_credentials' as any,
      },
    });
  }

  async findRecentByUserId(
    userId: string,
    limit: number,
  ): Promise<LoginAttempt[]> {
    const orms = await this.ormRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return orms.map((o) =>
      LoginAttempt.reconstitute({
        id: o.id,
        email: o.email,
        ip: o.ip,
        userAgent: o.userAgent,
        status: o.status as LoginAttemptStatus,
        userId: o.userId,
        createdAt: o.createdAt,
      }),
    );
  }
}
