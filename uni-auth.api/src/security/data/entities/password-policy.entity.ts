import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'password_policies' })
export class PasswordPolicyEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'int', default: 8 })
  minLength: number;

  @Column({ type: 'boolean', default: true })
  requireUppercase: boolean;

  @Column({ type: 'boolean', default: true })
  requireNumbers: boolean;

  @Column({ type: 'boolean', default: false })
  requireSpecial: boolean;

  @Column({ type: 'int', nullable: true })
  maxAgeDays: number | null;
}
