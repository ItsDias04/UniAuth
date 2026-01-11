import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Client } from './client.entity';

@Entity('client_redirect_uris')
export class RedirectUri extends BaseEntity {
  @ManyToOne(() => Client, (c) => c.redirectUris)
  client: Client;

  @Column({ type: 'varchar' })
  uri: string;
}
