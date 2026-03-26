import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateAuthSessionInput,
  IAuthSessionRepository,
} from '../../domain/repositories/auth-session.repository.interface';
import { AuthSessionOrmEntity } from './auth-session.orm-entity';

@Injectable()
export class AuthSessionRepository implements IAuthSessionRepository {
  constructor(
    @InjectRepository(AuthSessionOrmEntity)
    private readonly repository: Repository<AuthSessionOrmEntity>,
  ) {}

  async create(input: CreateAuthSessionInput): Promise<void> {
    await this.repository.insert({
      id: input.id,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      refreshTokenExpiresAt: input.refreshTokenExpiresAt,
    });
  }
}
