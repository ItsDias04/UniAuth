import { Entity, Column, OneToOne } from 'typeorm';
import { Credential } from './credential.entity';
import { IdentityProfile } from './identity-profile.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum AccountStatus {
  ACTIVE = 'active',
  BLOCKED = 'blocked',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ type: 'enum', enum: AccountStatus, default: AccountStatus.ACTIVE })
  status: AccountStatus;

  @OneToOne(() => Credential, (c: Credential) => c.user, { cascade: true, eager: true })
  credential: Credential;

  @OneToOne(() => IdentityProfile, (p: IdentityProfile) => p.user, { cascade: true, eager: true })
  profile: IdentityProfile;
}
