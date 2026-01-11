import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RedirectUri } from './redirect-uri.entity';

@Entity('clients')
export class Client extends BaseEntity {
  @Column({ unique: true })
  clientId: string;

  @Column()
  clientSecretHash: string;

  @Column()
  clientSecretSalt: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  name: string | null;

  // store allowed redirect URIs in separate table
  @OneToMany(() => RedirectUri, (r) => r.client, { cascade: true, eager: true })
  redirectUris: RedirectUri[];

  // scopes allowed for this client
  @Column({ type: 'simple-array', default: '' })
  scopes: string[];

  // allowed grant types e.g. authorization_code, client_credentials
  @Column({ type: 'simple-array', default: '' })
  grantTypes: string[];
}
