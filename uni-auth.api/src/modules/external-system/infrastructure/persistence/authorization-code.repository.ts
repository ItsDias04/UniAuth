import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IAuthorizationCodeRepository } from '../../domain/repositories/authorization-code.repository.interface';
import { AuthorizationCode } from '../../domain/entities/authorization-code.entity';
import { AuthorizationCodeOrmEntity } from './authorization-code.orm-entity';

@Injectable()
export class AuthorizationCodeRepository implements IAuthorizationCodeRepository {
  constructor(
    @InjectRepository(AuthorizationCodeOrmEntity)
    private readonly ormRepo: Repository<AuthorizationCodeOrmEntity>,
  ) {}

  async save(code: AuthorizationCode): Promise<void> {
    const orm = new AuthorizationCodeOrmEntity();
    orm.id = code.id;
    orm.codeHash = code.codeHash;
    orm.clientDbId = code.clientDbId;
    orm.userId = code.userId;
    orm.redirectUri = code.redirectUri;
    orm.scopes = code.scopes;
    orm.codeChallenge = code.codeChallenge;
    orm.codeChallengeMethod = code.codeChallengeMethod;
    orm.expiresAt = code.expiresAt;
    orm.used = code.used;
    await this.ormRepo.save(orm);
  }

  async findByCodeHash(codeHash: string): Promise<AuthorizationCode | null> {
    const orm = await this.ormRepo.findOne({ where: { codeHash } });
    if (!orm) return null;

    return AuthorizationCode.reconstitute({
      id: orm.id,
      codeHash: orm.codeHash,
      clientDbId: orm.clientDbId,
      userId: orm.userId,
      redirectUri: orm.redirectUri,
      scopes: orm.scopes,
      codeChallenge: orm.codeChallenge,
      codeChallengeMethod: orm.codeChallengeMethod,
      expiresAt: orm.expiresAt,
      used: orm.used,
      createdAt: orm.createdAt,
    });
  }

  async findById(id: string): Promise<AuthorizationCode | null> {
    const orm = await this.ormRepo.findOne({ where: { id } });
    if (!orm) return null;

    return AuthorizationCode.reconstitute({
      id: orm.id,
      codeHash: orm.codeHash,
      clientDbId: orm.clientDbId,
      userId: orm.userId,
      redirectUri: orm.redirectUri,
      scopes: orm.scopes,
      codeChallenge: orm.codeChallenge,
      codeChallengeMethod: orm.codeChallengeMethod,
      expiresAt: orm.expiresAt,
      used: orm.used,
      createdAt: orm.createdAt,
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.ormRepo.delete({
      expiresAt: LessThan(new Date()),
      used: true,
    });
    return result.affected || 0;
  }
}
