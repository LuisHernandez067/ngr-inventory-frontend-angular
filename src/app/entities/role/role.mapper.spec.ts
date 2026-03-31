import { RoleMapper } from './role.mapper';
import type { RoleDto } from './role.types';

const baseDto: RoleDto = {
  id: 'role-1',
  name: 'admin',
  description: 'Administrador del sistema',
  permissions: ['inventory.read', 'inventory.write', 'catalog.read'],
  isSystem: false,
  usersCount: 5,
  createdAt: '2024-01-15T09:00:00Z',
};

describe('RoleMapper', () => {
  it('maps base fields correctly', () => {
    const result = RoleMapper.fromDto(baseDto);
    expect(result.id).toBe('role-1');
    expect(result.name).toBe('admin');
    expect(result.description).toBe('Administrador del sistema');
    expect(result.usersCount).toBe(5);
  });

  it('permissionsCount equals permissions array length', () => {
    const result = RoleMapper.fromDto(baseDto);
    expect(result.permissionsCount).toBe(3);
  });

  it('permissionsCount is 0 when permissions is empty', () => {
    const result = RoleMapper.fromDto({ ...baseDto, permissions: [] });
    expect(result.permissionsCount).toBe(0);
  });

  it('isDeletable is false when isSystem is true', () => {
    const result = RoleMapper.fromDto({ ...baseDto, isSystem: true });
    expect(result.isDeletable).toBe(false);
  });

  it('isDeletable is true when isSystem is false', () => {
    const result = RoleMapper.fromDto({ ...baseDto, isSystem: false });
    expect(result.isDeletable).toBe(true);
  });

  it('createdAt is parsed to Date object', () => {
    const result = RoleMapper.fromDto(baseDto);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.getFullYear()).toBe(2024);
  });

  it('permissions array is mapped correctly', () => {
    const result = RoleMapper.fromDto(baseDto);
    expect(result.permissions).toEqual(['inventory.read', 'inventory.write', 'catalog.read']);
  });
});
