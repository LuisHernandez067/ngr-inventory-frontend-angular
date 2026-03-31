import { AuthMapper } from './auth.mapper';
import type { AuthMeResponseDto } from './auth.types';

describe('AuthMapper', () => {
  const dto: AuthMeResponseDto = {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    roles: [{ id: 'r1', name: 'admin' }],
    permissions: ['products.read', 'products.write'],
  };

  describe('toViewModel', () => {
    it('should map id, email and name correctly', () => {
      const vm = AuthMapper.toViewModel(dto);
      expect(vm.id).toBe('1');
      expect(vm.email).toBe('john.doe@example.com');
      expect(vm.name).toBe('John Doe');
    });

    it('should extract role names from role objects', () => {
      const vm = AuthMapper.toViewModel(dto);
      expect(vm.roles).toEqual(['admin']);
    });

    it('should preserve permissions array', () => {
      const vm = AuthMapper.toViewModel(dto);
      expect(vm.permissions).toEqual(['products.read', 'products.write']);
    });

    it('should build initials from first two words of name', () => {
      const vm = AuthMapper.toViewModel(dto);
      expect(vm.initials).toBe('JD');
    });

    it('should build single initial for single-word name', () => {
      const vm = AuthMapper.toViewModel({ ...dto, name: 'Admin' });
      expect(vm.initials).toBe('A');
    });

    it('should only use first two words for initials', () => {
      const vm = AuthMapper.toViewModel({ ...dto, name: 'John Michael Doe' });
      expect(vm.initials).toBe('JM');
    });
  });
});
