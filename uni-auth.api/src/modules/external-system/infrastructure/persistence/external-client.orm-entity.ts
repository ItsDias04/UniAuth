import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * TypeORM Entity — OAuth2 клиент (внешняя система).
 */
@Entity('external_clients')
export class ExternalClientOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'varchar', length: 100, unique: true, name: 'client_id' })
  clientId: string;

  @Column({ type: 'text', name: 'client_secret_hash' })
  clientSecretHash: string;

  @Column({ type: 'jsonb', name: 'redirect_uris' })
  redirectUris: string[];

  @Column({ type: 'jsonb', name: 'allowed_grant_types' })
  allowedGrantTypes: string[];

  @Column({ type: 'jsonb', name: 'allowed_scopes' })
  allowedScopes: string[];

  @Column({
    type: 'enum',
    enum: ['active', 'revoked', 'suspended'],
    default: 'active',
  })
  status: string;

  @Column({ type: 'uuid', name: 'owner_id' })
  ownerId: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'homepage_url' })
  homepageUrl: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'logo_url' })
  logoUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
