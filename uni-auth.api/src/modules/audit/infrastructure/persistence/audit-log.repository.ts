import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAuditLogRepository } from '../../domain/repositories/audit-log.repository.interface';
import {
  AuditLogEntry,
  AuditAction,
  AuditSeverity,
} from '../../domain/entities/audit-log-entry.entity';
import { AuditLogOrmEntity } from './audit-log.orm-entity';

@Injectable()
export class AuditLogRepository implements IAuditLogRepository {
  constructor(
    @InjectRepository(AuditLogOrmEntity)
    private readonly ormRepo: Repository<AuditLogOrmEntity>,
  ) {}

  async save(entry: AuditLogEntry): Promise<void> {
    await this.ormRepo.save({
      id: entry.id,
      action: entry.action,
      severity: entry.severity,
      userId: entry.userId,
      ip: entry.ip,
      userAgent: entry.userAgent,
      details: entry.details,
      timestamp: entry.timestamp,
    });
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const [orms, total] = await this.ormRepo.findAndCount({
      where: { userId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      entries: orms.map((o) => this.toDomain(o)),
      total,
    };
  }

  async findByAction(
    action: AuditAction,
    page: number,
    limit: number,
  ): Promise<{ entries: AuditLogEntry[]; total: number }> {
    const [orms, total] = await this.ormRepo.findAndCount({
      where: { action },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return {
      entries: orms.map((o) => this.toDomain(o)),
      total,
    };
  }

  async findRecent(limit: number): Promise<AuditLogEntry[]> {
    const orms = await this.ormRepo.find({
      order: { timestamp: 'DESC' },
      take: limit,
    });
    return orms.map((o) => this.toDomain(o));
  }

  private toDomain(orm: AuditLogOrmEntity): AuditLogEntry {
    return AuditLogEntry.reconstitute({
      id: orm.id,
      action: orm.action as AuditAction,
      severity: orm.severity as AuditSeverity,
      userId: orm.userId,
      ip: orm.ip,
      userAgent: orm.userAgent,
      details: orm.details || {},
      timestamp: orm.timestamp,
      createdAt: orm.createdAt,
    });
  }
}
