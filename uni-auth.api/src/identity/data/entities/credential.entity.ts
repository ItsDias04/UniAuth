import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('credentials')
export class Credential extends BaseEntity {
  @OneToOne(() => User, (u) => u.credential)
  @JoinColumn()
  user: User;

  @Column()
  passwordHash: string;

  @Column()
  salt: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastChangedAt: Date | null;
}
