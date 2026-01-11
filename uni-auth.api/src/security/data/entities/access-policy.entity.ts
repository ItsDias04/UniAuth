import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity({ name: 'access_policies' })
export class AccessPolicyEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 128 })
  name: string;

  @Column({ type: 'boolean', default: false })
  requireMfaOnNewIp: boolean;

  @Column({ type: 'boolean', default: false })
  requireMfaAlways: boolean;

  @Column({ type: 'jsonb', nullable: true })
  conditions: any | null;
}
