import { WarehouseMapper } from './warehouse.mapper';
import type { WarehouseDto } from './warehouse.types';

describe('WarehouseMapper', () => {
  const dto: WarehouseDto = {
    id: 'w1',
    code: 'ALM-001',
    name: 'Almacén Central',
    description: 'Almacén principal de la empresa',
    address: 'Av. Corrientes 1234, CABA',
    isActive: true,
    locationCount: 12,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-06-01T08:30:00.000Z',
  };

  describe('fromDto', () => {
    it('should map all fields correctly', () => {
      const vm = WarehouseMapper.fromDto(dto);
      expect(vm.id).toBe('w1');
      expect(vm.code).toBe('ALM-001');
      expect(vm.name).toBe('Almacén Central');
      expect(vm.description).toBe('Almacén principal de la empresa');
      expect(vm.address).toBe('Av. Corrientes 1234, CABA');
      expect(vm.isActive).toBe(true);
      expect(vm.locationCount).toBe(12);
    });

    it('should provide default empty string for optional description', () => {
      const vm = WarehouseMapper.fromDto({ ...dto, description: undefined });
      expect(vm.description).toBe('');
    });

    it('should provide default empty string for optional address', () => {
      const vm = WarehouseMapper.fromDto({ ...dto, address: undefined });
      expect(vm.address).toBe('');
    });

    it('should set statusLabel to "Activo" when isActive is true', () => {
      const vm = WarehouseMapper.fromDto({ ...dto, isActive: true });
      expect(vm.statusLabel).toBe('Activo');
    });

    it('should set statusLabel to "Inactivo" when isActive is false', () => {
      const vm = WarehouseMapper.fromDto({ ...dto, isActive: false });
      expect(vm.statusLabel).toBe('Inactivo');
    });

    it('should convert createdAt string to Date object', () => {
      const vm = WarehouseMapper.fromDto(dto);
      expect(vm.createdAt).toBeInstanceOf(Date);
      expect(vm.createdAt.toISOString()).toBe('2024-01-15T10:00:00.000Z');
    });

    it('should convert updatedAt string to Date object', () => {
      const vm = WarehouseMapper.fromDto(dto);
      expect(vm.updatedAt).toBeInstanceOf(Date);
      expect(vm.updatedAt.toISOString()).toBe('2024-06-01T08:30:00.000Z');
    });
  });

  describe('fromDtoList', () => {
    it('should map an array of DTOs to an array of ViewModels', () => {
      const dtos: WarehouseDto[] = [
        dto,
        { ...dto, id: 'w2', code: 'ALM-002', name: 'Almacén Sur', isActive: false },
      ];
      const vms = WarehouseMapper.fromDtoList(dtos);
      expect(vms).toHaveLength(2);
      expect(vms[0].id).toBe('w1');
      expect(vms[1].id).toBe('w2');
      expect(vms[1].statusLabel).toBe('Inactivo');
    });

    it('should return an empty array when given an empty array', () => {
      const vms = WarehouseMapper.fromDtoList([]);
      expect(vms).toEqual([]);
    });
  });
});
