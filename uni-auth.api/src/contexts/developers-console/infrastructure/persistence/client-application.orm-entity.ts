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
@Index('idx_dev_console_api_token_hash', ['apiTokenHash'], { unique: true })
export class ClientApplicationOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'owner_user_id' })
  ownerUserId: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 1000, name: 'redirect_route' })
  redirectRoute: string;

  @Column({ type: 'varchar', length: 24, default: 'draft' })
  status: string;

  @Column({ type: 'varchar', length: 45, name: 'ip', default: () => "''" })
  ip: string;

  @Column({ type: 'boolean', name: 'ip_is_verified', default: false })
  ipIsVerified: boolean;

  @Column({
    type: 'varchar',
    length: 64,
    name: 'api_token_hash',
    nullable: true,
  })
  apiTokenHash: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
