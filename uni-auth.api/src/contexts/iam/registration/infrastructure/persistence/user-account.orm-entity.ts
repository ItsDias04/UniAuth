import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('iam_user_accounts')
@Index('idx_iam_user_accounts_email', ['email'], { unique: true })
@Index('idx_iam_user_accounts_login', ['login'], { unique: true })
export class UserAccountOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  login: string;

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'varchar', length: 80, name: 'first_name' })
  firstName: string;

  @Column({ type: 'varchar', length: 80, name: 'last_name' })
  lastName: string;

  @Column({ type: 'varchar', length: 32 })
  phone: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'avatar_url' })
  avatarUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
