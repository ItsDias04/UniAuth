import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('login_attempts')
@Index('idx_login_attempts_email', ['email'])
@Index('idx_login_attempts_ip', ['ip'])
@Index('idx_login_attempts_created_at', ['createdAt'])
export class LoginAttemptOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 50 })
  ip: string;

  @Column({ type: 'text', name: 'user_agent' })
  userAgent: string;

  @Column({
    type: 'enum',
    enum: ['success', 'failed_credentials', 'failed_mfa', 'blocked', 'locked'],
  })
  status: string;

  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
