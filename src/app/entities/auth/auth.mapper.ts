import { AuthMeResponseDto, AuthUser } from './auth.types';

export class AuthMapper {
  static toViewModel(dto: AuthMeResponseDto): AuthUser {
    return {
      id: dto.id,
      email: dto.email,
      name: dto.name,
      initials: AuthMapper.buildInitials(dto.name),
      roles: dto.roles.map(r => r.name),
      permissions: dto.permissions,
    };
  }

  private static buildInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join('');
  }
}
