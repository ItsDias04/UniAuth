import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../../identity/data/entities/user.entity';

@Entity('sessions')
export class Session extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ type: 'varchar', nullable: true })
  userAgent: string | null;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}
