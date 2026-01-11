import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../../identity/data/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ type: 'varchar' })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  revoked: boolean;
}
