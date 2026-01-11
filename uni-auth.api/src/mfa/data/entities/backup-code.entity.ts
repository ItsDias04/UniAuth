import { Entity, Column, ManyToOne } from 'typeorm';
import { User } from '../../../identity/data/entities/user.entity';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('mfa_backup_codes')
export class BackupCode extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  user: User;

  @Column({ type: 'varchar' })
  codeHash: string;

  @Column({ type: 'boolean', default: false })
  used: boolean;
}
