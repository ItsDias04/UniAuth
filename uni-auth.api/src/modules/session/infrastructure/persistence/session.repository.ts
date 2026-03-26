import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISessionRepository } from '../../domain/repositories/session.repository.interface';
import { Session, SessionStatus } from '../../domain/entities/session.entity';
import { SessionOrmEntity } from './session.orm-entity';

@Injectable()
export class SessionRepository implements ISessionRepository {
  constructor(
    @InjectRepository(SessionOrmEntity)
    private readonly ormRepo: Repository<SessionOrmEntity>,
  ) {}

  async findById(id: string): Promise<Session | null> {
    const orm = await this.ormRepo.findOne({ where: { id } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByUserId(userId: string): Promise<Session[]> {
    const orms = await this.ormRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async findActiveByUserId(userId: string): Promise<Session[]> {
    const orms = await this.ormRepo.find({
      where: { userId, status: 'active' },
      order: { lastActiveAt: 'DESC' },
    });
    return orms.map((o) => this.toDomain(o));
  }

  async save(session: Session): Promise<void> {
    await this.ormRepo.save({
      id: session.id,
      userId: session.userId,
      status: session.status,
      ip: session.ip,
      userAgent: session.userAgent,
      deviceFingerprint: session.deviceFingerprint,
      expiresAt: session.expiresAt,
      lastActiveAt: session.lastActiveAt,
    });
  }

  async delete(id: string): Promise<void> {
    await this.ormRepo.delete(id);
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.ormRepo.update(
      { userId, status: 'active' },
      { status: 'revoked' },
    );
  }

  private toDomain(orm: SessionOrmEntity): Session {
    return Session.reconstitute({
      id: orm.id,
      userId: orm.userId,
      status: orm.status as SessionStatus,
      ip: orm.ip,
      userAgent: orm.userAgent,
      deviceFingerprint: orm.deviceFingerprint,
      expiresAt: orm.expiresAt,
      lastActiveAt: orm.lastActiveAt,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }
}
