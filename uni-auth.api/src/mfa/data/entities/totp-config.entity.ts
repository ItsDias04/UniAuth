import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { MFAMethod } from './mfa-method.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('mfa_totp_configs')
export class TOTPConfig extends BaseEntity {
  @OneToOne(() => MFAMethod, { nullable: false })
  @JoinColumn()
  method: MFAMethod;

  @Column({ type: 'varchar' })
  secretSeed: string;

  // createdAt/updatedAt inherited from BaseEntity
}
