import { SupplierMapper } from './supplier.mapper';
import type { SupplierDto } from './supplier.types';

describe('SupplierMapper', () => {
  const dto: SupplierDto = {
    id: 'sup1',
    name: 'Proveedor S.A.',
    contactName: 'Juan Pérez',
    email: 'juan@proveedor.com',
    phone: '+54 11 1234-5678',
    address: 'Av. Siempreviva 742',
    active: true,
    createdAt: '2024-03-01T08:00:00.000Z',
    updatedAt: '2024-07-10T14:00:00.000Z',
  };

  describe('toViewModel', () => {
    it('should map all scalar fields correctly', () => {
      const vm = SupplierMapper.toViewModel(dto);
      expect(vm.id).toBe('sup1');
      expect(vm.name).toBe('Proveedor S.A.');
      expect(vm.active).toBe(true);
    });

    it('should map optional string fields when present', () => {
      const vm = SupplierMapper.toViewModel(dto);
      expect(vm.contactName).toBe('Juan Pérez');
      expect(vm.email).toBe('juan@proveedor.com');
      expect(vm.phone).toBe('+54 11 1234-5678');
      expect(vm.address).toBe('Av. Siempreviva 742');
    });

    it('should coerce null contactName to empty string', () => {
      const vm = SupplierMapper.toViewModel({ ...dto, contactName: null });
      expect(vm.contactName).toBe('');
    });

    it('should coerce null email to empty string', () => {
      const vm = SupplierMapper.toViewModel({ ...dto, email: null });
      expect(vm.email).toBe('');
    });

    it('should coerce null phone to empty string', () => {
      const vm = SupplierMapper.toViewModel({ ...dto, phone: null });
      expect(vm.phone).toBe('');
    });

    it('should coerce null address to empty string', () => {
      const vm = SupplierMapper.toViewModel({ ...dto, address: null });
      expect(vm.address).toBe('');
    });

    it('should set statusLabel to "Activo" when active is true', () => {
      const vm = SupplierMapper.toViewModel({ ...dto, active: true });
      expect(vm.statusLabel).toBe('Activo');
    });

    it('should set statusLabel to "Inactivo" when active is false', () => {
      const vm = SupplierMapper.toViewModel({ ...dto, active: false });
      expect(vm.statusLabel).toBe('Inactivo');
    });

    it('should convert createdAt string to Date object', () => {
      const vm = SupplierMapper.toViewModel(dto);
      expect(vm.createdAt).toBeInstanceOf(Date);
      expect(vm.createdAt.toISOString()).toBe('2024-03-01T08:00:00.000Z');
    });

    it('should convert updatedAt string to Date object', () => {
      const vm = SupplierMapper.toViewModel(dto);
      expect(vm.updatedAt).toBeInstanceOf(Date);
      expect(vm.updatedAt.toISOString()).toBe('2024-07-10T14:00:00.000Z');
    });
  });
});
