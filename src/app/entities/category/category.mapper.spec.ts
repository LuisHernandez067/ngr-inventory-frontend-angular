import { CategoryMapper } from './category.mapper';
import type { CategoryDto } from './category.types';

describe('CategoryMapper', () => {
  const dto: CategoryDto = {
    id: 'cat1',
    name: 'Electrónica',
    description: 'Productos electrónicos',
    active: true,
    productCount: 42,
    createdAt: '2024-02-10T12:00:00.000Z',
    updatedAt: '2024-05-20T09:15:00.000Z',
  };

  describe('toViewModel', () => {
    it('should map all scalar fields correctly', () => {
      const vm = CategoryMapper.toViewModel(dto);
      expect(vm.id).toBe('cat1');
      expect(vm.name).toBe('Electrónica');
      expect(vm.active).toBe(true);
      expect(vm.productCount).toBe(42);
    });

    it('should map description when present', () => {
      const vm = CategoryMapper.toViewModel(dto);
      expect(vm.description).toBe('Productos electrónicos');
    });

    it('should coerce null description to empty string', () => {
      const vm = CategoryMapper.toViewModel({ ...dto, description: null });
      expect(vm.description).toBe('');
    });

    it('should set statusLabel to "Activo" when active is true', () => {
      const vm = CategoryMapper.toViewModel({ ...dto, active: true });
      expect(vm.statusLabel).toBe('Activo');
    });

    it('should set statusLabel to "Inactivo" when active is false', () => {
      const vm = CategoryMapper.toViewModel({ ...dto, active: false });
      expect(vm.statusLabel).toBe('Inactivo');
    });

    it('should convert createdAt string to Date object', () => {
      const vm = CategoryMapper.toViewModel(dto);
      expect(vm.createdAt).toBeInstanceOf(Date);
      expect(vm.createdAt.toISOString()).toBe('2024-02-10T12:00:00.000Z');
    });

    it('should convert updatedAt string to Date object', () => {
      const vm = CategoryMapper.toViewModel(dto);
      expect(vm.updatedAt).toBeInstanceOf(Date);
      expect(vm.updatedAt.toISOString()).toBe('2024-05-20T09:15:00.000Z');
    });
  });
});
