import { Entity, Column, ManyToOne } from 'typeorm';
import { User } from '../../../identity/data/entities/user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('mfa_challenges')
export class MFAChallenge extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'int', default: 0 })
  attempts: number;
}
