import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('authorization_requests')
export class AuthorizationRequest extends BaseEntity {
  @Column({ type: 'varchar', length: 128 })
  clientId: string;

  @Column({ type: 'varchar', length: 1024 })
  redirectUri: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  scope: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  state: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  nonce: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  codeChallenge: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  codeChallengeMethod: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
