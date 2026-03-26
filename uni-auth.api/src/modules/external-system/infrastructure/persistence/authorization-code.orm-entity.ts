import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

/**
 * TypeORM Entity — код авторизации OAuth2.
 */
@Entity('authorization_codes')
export class AuthorizationCodeOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true, name: 'code_hash' })
  codeHash: string;

  @Column({ type: 'uuid', name: 'client_db_id' })
  clientDbId: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text', name: 'redirect_uri' })
  redirectUri: string;

  @Column({ type: 'jsonb' })
  scopes: string[];

  @Column({ type: 'varchar', length: 128, nullable: true, name: 'code_challenge' })
  codeChallenge: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'code_challenge_method' })
  codeChallengeMethod: string | null;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
