import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('client_scopes')
export class Scope extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description: string | null;
}
