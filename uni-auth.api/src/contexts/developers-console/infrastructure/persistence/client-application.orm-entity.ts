import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('developers_console_client_applications')
@Index('idx_dev_console_owner_user_id', ['ownerUserId'])
export class ClientApplicationOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  ownerUserId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 1000, name: 'redirect_route' })
  redirectRoute: string;

  @Column({ type: 'jsonb', name: 'verified_ips', default: () => "'[]'" })
  verifiedIps: string[];

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
