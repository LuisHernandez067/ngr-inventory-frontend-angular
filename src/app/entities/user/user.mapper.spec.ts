import { UserMapper } from './user.mapper';
import type { UserDto } from './user.types';

const baseDto: UserDto = {
  id: 'user-1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  status: 'active',
  roles: ['admin', 'viewer'],
  createdAt: '2024-03-01T10:00:00Z',
};

describe('UserMapper', () => {
  it('maps base fields correctly', () => {
    const result = UserMapper.fromDto(baseDto);
    expect(result.id).toBe('user-1');
    expect(result.email).toBe('john.doe@example.com');
    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
  });

  it('statusLabel is "Activo" for active', () => {
    const result = UserMapper.fromDto({ ...baseDto, status: 'active' });
    expect(result.statusLabel).toBe('Activo');
  });

  it('statusLabel is "Inactivo" for inactive', () => {
    const result = UserMapper.fromDto({ ...baseDto, status: 'inactive' });
    expect(result.statusLabel).toBe('Inactivo');
  });

  it('statusLabel is "Suspendido" for suspended', () => {
    const result = UserMapper.fromDto({ ...baseDto, status: 'suspended' });
    expect(result.statusLabel).toBe('Suspendido');
  });

  it('fullName is derived from firstName and lastName', () => {
    const result = UserMapper.fromDto({ ...baseDto, firstName: 'Jane', lastName: 'Smith' });
    expect(result.fullName).toBe('Jane Smith');
  });

  it('roleNames joins roles with comma when roles present', () => {
    const result = UserMapper.fromDto({ ...baseDto, roles: ['admin', 'viewer'] });
    expect(result.roleNames).toBe('admin, viewer');
  });

  it('roleNames is "Sin roles" when roles array is empty', () => {
    const result = UserMapper.fromDto({ ...baseDto, roles: [] });
    expect(result.roleNames).toBe('Sin roles');
  });

  it('createdAt is parsed to Date object', () => {
    const result = UserMapper.fromDto(baseDto);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.getFullYear()).toBe(2024);
  });

  it('lastLoginAt is null when not provided', () => {
    const result = UserMapper.fromDto(baseDto);
    expect(result.lastLoginAt).toBeNull();
  });

  it('lastLoginAt is parsed to Date when provided', () => {
    const result = UserMapper.fromDto({ ...baseDto, lastLoginAt: '2024-06-15T08:30:00Z' });
    expect(result.lastLoginAt).toBeInstanceOf(Date);
    expect(result.lastLoginAt?.getFullYear()).toBe(2024);
  });
});
