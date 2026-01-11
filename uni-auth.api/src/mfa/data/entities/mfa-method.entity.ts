import { Entity, Column, ManyToOne } from 'typeorm';
import { User } from '../../../identity/data/entities/user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum MFAMethodType {
  TOTP = 'totp',
  SMS = 'sms',
  WEBAUTHN = 'webauthn',
}

@Entity('mfa_methods')
export class MFAMethod extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ type: 'enum', enum: MFAMethodType })
  type: MFAMethodType;

  @Column({ type: 'boolean', default: false })
  confirmed: boolean;
}
