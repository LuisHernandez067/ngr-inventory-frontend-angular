import { LocationMapper } from './location.mapper';
import type { LocationDto } from './location.types';

describe('LocationMapper', () => {
  const dto: LocationDto = {
    id: 'loc1',
    code: 'LOC-A1-E2-B3',
    name: 'Pasillo A, Estante 2, Bin 3',
    description: 'Ubicación en zona A',
    warehouseId: 'w1',
    warehouseName: 'Almacén Central',
    aisle: 'A1',
    shelf: 'E2',
    bin: 'B3',
    isActive: true,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-06-01T08:30:00.000Z',
  };

  describe('fromDto', () => {
    it('should map all fields correctly', () => {
      const vm = LocationMapper.fromDto(dto);
      expect(vm.id).toBe('loc1');
      expect(vm.code).toBe('LOC-A1-E2-B3');
      expect(vm.name).toBe('Pasillo A, Estante 2, Bin 3');
      expect(vm.description).toBe('Ubicación en zona A');
      expect(vm.warehouseId).toBe('w1');
      expect(vm.warehouseName).toBe('Almacén Central');
      expect(vm.aisle).toBe('A1');
      expect(vm.shelf).toBe('E2');
      expect(vm.bin).toBe('B3');
      expect(vm.isActive).toBe(true);
    });

    it('should default optional fields to empty string', () => {
      const vm = LocationMapper.fromDto({
        ...dto,
        description: undefined,
        aisle: undefined,
        shelf: undefined,
        bin: undefined,
      });
      expect(vm.description).toBe('');
      expect(vm.aisle).toBe('');
      expect(vm.shelf).toBe('');
      expect(vm.bin).toBe('');
    });

    it('should set statusLabel to "Activo" when isActive is true', () => {
      const vm = LocationMapper.fromDto({ ...dto, isActive: true });
      expect(vm.statusLabel).toBe('Activo');
    });

    it('should set statusLabel to "Inactivo" when isActive is false', () => {
      const vm = LocationMapper.fromDto({ ...dto, isActive: false });
      expect(vm.statusLabel).toBe('Inactivo');
    });

    it('should build breadcrumb with only warehouseName when aisle/shelf/bin are absent', () => {
      const vm = LocationMapper.fromDto({
        ...dto,
        aisle: undefined,
        shelf: undefined,
        bin: undefined,
      });
      expect(vm.breadcrumb).toBe('Almacén Central');
    });

    it('should build breadcrumb with all parts when all present', () => {
      const vm = LocationMapper.fromDto(dto);
      expect(vm.breadcrumb).toBe('Almacén Central > A1 > E2 > B3');
    });

    it('should filter out empty/undefined parts in breadcrumb', () => {
      const vm = LocationMapper.fromDto({ ...dto, shelf: undefined, bin: undefined });
      expect(vm.breadcrumb).toBe('Almacén Central > A1');
    });

    it('should convert createdAt and updatedAt strings to Date objects', () => {
      const vm = LocationMapper.fromDto(dto);
      expect(vm.createdAt).toBeInstanceOf(Date);
      expect(vm.createdAt.toISOString()).toBe('2024-01-15T10:00:00.000Z');
      expect(vm.updatedAt).toBeInstanceOf(Date);
      expect(vm.updatedAt.toISOString()).toBe('2024-06-01T08:30:00.000Z');
    });
  });

  describe('fromDtoList', () => {
    it('should map an array of DTOs to an array of ViewModels', () => {
      const dtos: LocationDto[] = [
        dto,
        { ...dto, id: 'loc2', code: 'LOC-B1', isActive: false },
      ];
      const vms = LocationMapper.fromDtoList(dtos);
      expect(vms).toHaveLength(2);
      expect(vms[0].id).toBe('loc1');
      expect(vms[1].id).toBe('loc2');
      expect(vms[1].statusLabel).toBe('Inactivo');
    });

    it('should return an empty array when given an empty array', () => {
      const vms = LocationMapper.fromDtoList([]);
      expect(vms).toEqual([]);
    });
  });
});
