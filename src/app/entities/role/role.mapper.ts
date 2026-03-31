import type { RoleDto, Role } from './role.types';

export class RoleMapper {
  static fromDto(dto: RoleDto): Role {
    return {
      id:               dto.id,
      name:             dto.name,
      description:      dto.description,
      permissions:      dto.permissions,
      permissionsCount: dto.permissions.length,
      isSystem:         dto.isSystem,
      isDeletable:      !dto.isSystem,
      usersCount:       dto.usersCount,
      createdAt:        new Date(dto.createdAt),
    };
  }
}
