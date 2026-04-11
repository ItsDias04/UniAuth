import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SecurityEventCategory } from '../../domain/entities/security-event-category.enum';

@Entity('audit_security_events')
@Index('idx_audit_security_events_created_at', ['createdAt'])
@Index('idx_audit_security_events_category', ['category'])
@Index('idx_audit_security_events_ip_address', ['ipAddress'])
export class SecurityEventOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @Column({ type: 'varchar', length: 32 })
  category: SecurityEventCategory = SecurityEventCategory.NORMAL;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType: string = 'http_exchange';

  @Column({ type: 'varchar', length: 16 })
  method: string = '';

  @Column({ name: 'request_path', type: 'text' })
  path: string = '';

  @Column({ name: 'query_string', type: 'text', nullable: true })
  queryString: string | null = null;

  @Column({ name: 'request_headers', type: 'text', nullable: true })
  requestHeaders: string | null = null;

  @Column({ name: 'request_body', type: 'text', nullable: true })
  requestBody: string | null = null;

  @Column({ name: 'response_status', type: 'int' })
  responseStatus: number = 200;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string | null = null;

  @Column({ name: 'duration_ms', type: 'int' })
  durationMs: number = 0;

  @Column({ name: 'ip_address', type: 'varchar', length: 64 })
  ipAddress: string = '';

  @Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
  userAgent: string | null = null;

  @Column({ name: 'user_id', type: 'varchar', length: 128, nullable: true })
  userId: string | null = null;

  @Column({ name: 'reason_codes', type: 'text', nullable: true })
  reasonCodes: string | null = null;

  @Column({ name: 'request_id', type: 'varchar', length: 64, nullable: true })
  requestId: string | null = null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date = new Date();
}
