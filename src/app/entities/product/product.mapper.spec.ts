import { ProductMapper } from './product.mapper';
import type { ProductDto, ProductStockEntryDto } from './product.types';

describe('ProductMapper', () => {
  const dto: ProductDto = {
    id: 'p1',
    sku: 'SKU-001',
    name: 'Producto Test',
    description: 'Una descripción',
    categoryId: 'cat1',
    categoryName: 'Categoría Test',
    unit: 'kg',
    minStock: 10,
    active: true,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-06-01T08:30:00.000Z',
  };

  describe('toViewModel', () => {
    it('should map all scalar fields correctly', () => {
      const vm = ProductMapper.toViewModel(dto);
      expect(vm.id).toBe('p1');
      expect(vm.sku).toBe('SKU-001');
      expect(vm.name).toBe('Producto Test');
      expect(vm.categoryId).toBe('cat1');
      expect(vm.categoryName).toBe('Categoría Test');
      expect(vm.unit).toBe('kg');
      expect(vm.minStock).toBe(10);
      expect(vm.active).toBe(true);
    });

    it('should map description when present', () => {
      const vm = ProductMapper.toViewModel(dto);
      expect(vm.description).toBe('Una descripción');
    });

    it('should coerce null description to empty string', () => {
      const vm = ProductMapper.toViewModel({ ...dto, description: null });
      expect(vm.description).toBe('');
    });

    it('should set statusLabel to "Activo" when active is true', () => {
      const vm = ProductMapper.toViewModel({ ...dto, active: true });
      expect(vm.statusLabel).toBe('Activo');
    });

    it('should set statusLabel to "Inactivo" when active is false', () => {
      const vm = ProductMapper.toViewModel({ ...dto, active: false });
      expect(vm.statusLabel).toBe('Inactivo');
    });

    it('should convert createdAt string to Date object', () => {
      const vm = ProductMapper.toViewModel(dto);
      expect(vm.createdAt).toBeInstanceOf(Date);
      expect(vm.createdAt.toISOString()).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should convert updatedAt string to Date object', () => {
      const vm = ProductMapper.toViewModel(dto);
      expect(vm.updatedAt).toBeInstanceOf(Date);
      expect(vm.updatedAt.toISOString()).toBe('2024-06-01T08:30:00.000Z');
    });
  });

  describe('stockToViewModel', () => {
    const stockDto: ProductStockEntryDto = {
      warehouseId: 'w1',
      warehouseName: 'Almacén Principal',
      locationId: 'loc1',
      locationName: 'Estante A',
      quantity: 5,
    };

    it('should map all stock fields correctly', () => {
      const vm = ProductMapper.stockToViewModel(stockDto, 10);
      expect(vm.warehouseId).toBe('w1');
      expect(vm.warehouseName).toBe('Almacén Principal');
      expect(vm.locationId).toBe('loc1');
      expect(vm.locationName).toBe('Estante A');
      expect(vm.quantity).toBe(5);
    });

    it('should set isBelowMin to true when quantity < minStock', () => {
      const vm = ProductMapper.stockToViewModel({ ...stockDto, quantity: 5 }, 10);
      expect(vm.isBelowMin).toBe(true);
    });

    it('should set isBelowMin to false when quantity equals minStock', () => {
      const vm = ProductMapper.stockToViewModel({ ...stockDto, quantity: 10 }, 10);
      expect(vm.isBelowMin).toBe(false);
    });

    it('should set isBelowMin to false when quantity > minStock', () => {
      const vm = ProductMapper.stockToViewModel({ ...stockDto, quantity: 15 }, 10);
      expect(vm.isBelowMin).toBe(false);
    });

    it('should preserve null locationId and locationName', () => {
      const vm = ProductMapper.stockToViewModel(
        { ...stockDto, locationId: null, locationName: null },
        10,
      );
      expect(vm.locationId).toBeNull();
      expect(vm.locationName).toBeNull();
    });
  });
});
