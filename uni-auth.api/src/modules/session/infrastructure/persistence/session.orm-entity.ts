import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('sessions')
@Index('idx_sessions_user_id', ['userId'])
@Index('idx_sessions_status', ['status'])
export class SessionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({
    type: 'enum',
    enum: ['active', 'expired', 'revoked'],
    default: 'active',
  })
  status: string;

  @Column({ type: 'varchar', length: 50 })
  ip: string;

  @Column({ type: 'text', name: 'user_agent' })
  userAgent: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'device_fingerprint' })
  deviceFingerprint: string | null;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'timestamp', name: 'last_active_at' })
  lastActiveAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
