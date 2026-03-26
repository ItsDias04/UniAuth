import { UserStatus } from '../../domain/entities/user.entity';

export class UserResponseDto {
  id: string;
  email: string;
  displayName: string;
  status: UserStatus;
  roles: string[];
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;

  static fromDomain(user: {
    id: string;
    email: { toString(): string };
    displayName: string;
    status: UserStatus;
    roles: ReadonlyArray<{ name: string }>;
    mfaEnabled: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
  }): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.email = user.email.toString();
    dto.displayName = user.displayName;
    dto.status = user.status;
    dto.roles = user.roles.map((r) => r.name);
    dto.mfaEnabled = user.mfaEnabled;
    dto.lastLoginAt = user.lastLoginAt?.toISOString() ?? null;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
