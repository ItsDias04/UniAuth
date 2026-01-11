import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('authorization_codes')
export class AuthorizationCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  clientId: string;

  @Column({ type: 'varchar', nullable: true })
  redirectUri: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  codeChallenge: string | null;

  @Column({ type: 'varchar', nullable: true })
  codeChallengeMethod: string | null;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;
}
