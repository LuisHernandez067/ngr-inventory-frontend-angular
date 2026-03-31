import type { UserDto, User, UserStatus } from './user.types';

const STATUS_LABELS: Record<UserStatus, string> = {
  active:    'Activo',
  inactive:  'Inactivo',
  suspended: 'Suspendido',
};

export class UserMapper {
  static fromDto(dto: UserDto): User {
    return {
      id:           dto.id,
      email:        dto.email,
      firstName:    dto.firstName,
      lastName:     dto.lastName,
      fullName:     `${dto.firstName} ${dto.lastName}`,
      status:       dto.status,
      statusLabel:  STATUS_LABELS[dto.status] ?? dto.status,
      roles:        dto.roles,
      roleNames:    dto.roles.length > 0 ? dto.roles.join(', ') : 'Sin roles',
      createdAt:    new Date(dto.createdAt),
      lastLoginAt:  dto.lastLoginAt ? new Date(dto.lastLoginAt) : null,
    };
  }
}
