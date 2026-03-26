import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('audit_log')
@Index('idx_audit_log_user_id', ['userId'])
@Index('idx_audit_log_action', ['action'])
@Index('idx_audit_log_timestamp', ['timestamp'])
@Index('idx_audit_log_severity', ['severity'])
export class AuditLogOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({
    type: 'enum',
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  })
  severity: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ip: string | null;

  @Column({ type: 'text', nullable: true, name: 'user_agent' })
  userAgent: string | null;

  @Column({ type: 'jsonb', default: '{}' })
  details: Record<string, any>;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
