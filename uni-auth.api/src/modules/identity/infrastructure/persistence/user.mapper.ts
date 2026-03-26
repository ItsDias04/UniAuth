import { User, UserStatus } from '../../domain/entities/user.entity';
import { Role } from '../../domain/entities/role.entity';
import { UserOrmEntity } from './user.orm-entity';
import { RoleOrmEntity } from './role.orm-entity';

/**
 * Mapper — преобразование между Domain entity и ORM entity.
 * Следует принципу DDD: доменная модель не знает о persistence.
 */
export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    const roles = (orm.roles || []).map(
      (r) => new Role(r.id, r.name, r.description || '', r.permissions || []),
    );

    return User.reconstitute({
      id: orm.id,
      email: orm.email,
      passwordHash: orm.passwordHash,
      displayName: orm.displayName,
      status: orm.status as UserStatus,
      roles,
      mfaEnabled: orm.mfaEnabled,
      failedLoginAttempts: orm.failedLoginAttempts,
      lastLoginAt: orm.lastLoginAt,
      lockedUntil: orm.lockedUntil,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toPersistence(domain: User): Partial<UserOrmEntity> {
    const roleOrms: Partial<RoleOrmEntity>[] = domain.roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      permissions: [...r.permissions],
    }));

    return {
      id: domain.id,
      email: domain.email.toString(),
      passwordHash: domain.passwordHash.toString(),
      displayName: domain.displayName,
      status: domain.status,
      mfaEnabled: domain.mfaEnabled,
      failedLoginAttempts: domain.failedLoginAttempts,
      lastLoginAt: domain.lastLoginAt,
      lockedUntil: domain.lockedUntil,
      roles: roleOrms as RoleOrmEntity[],
    };
  }
}
