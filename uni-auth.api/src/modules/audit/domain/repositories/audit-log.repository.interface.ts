import { AuditLogEntry, AuditAction } from '../entities/audit-log-entry.entity';

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');

export interface IAuditLogRepository {
  save(entry: AuditLogEntry): Promise<void>;
  findByUserId(userId: string, page: number, limit: number): Promise<{ entries: AuditLogEntry[]; total: number }>;
  findByAction(action: AuditAction, page: number, limit: number): Promise<{ entries: AuditLogEntry[]; total: number }>;
  findRecent(limit: number): Promise<AuditLogEntry[]>;
}
