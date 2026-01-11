import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum SecurityEventType {
  LOGIN = 'login',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  MFA_ENROLL = 'mfa_enroll',
  MFA_REMOVE = 'mfa_remove',
  REGISTRATION = 'registration',
}

@Entity({ name: 'security_events' })
export class SecurityEventEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any | null;

  @Column({ type: 'double precision', nullable: true })
  riskScore: number | null;

  @Column({ type: 'boolean', default: false })
  success: boolean;
}
