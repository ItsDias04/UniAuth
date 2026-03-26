import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Декоратор @Roles(...) — указывает какие роли требуются для доступа.
 *
 * @example
 * @Roles('admin', 'moderator')
 * @Get('admin/users')
 * getAllUsers() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
