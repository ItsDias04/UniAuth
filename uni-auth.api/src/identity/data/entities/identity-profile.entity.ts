import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('identity_profiles')
export class IdentityProfile extends BaseEntity {
  @OneToOne(() => User, (u) => u.profile)
  @JoinColumn()
  user: User;

  @Column({ type: 'varchar', nullable: true })
  firstName: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', nullable: true })
  timezone: string | null;
}
