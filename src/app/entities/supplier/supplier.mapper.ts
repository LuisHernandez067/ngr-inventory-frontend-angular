import { SupplierDto, Supplier } from './supplier.types';

export class SupplierMapper {
  static toViewModel(dto: SupplierDto): Supplier {
    return {
      id: dto.id,
      name: dto.name,
      contactName: dto.contactName ?? '',
      email: dto.email ?? '',
      phone: dto.phone ?? '',
      address: dto.address ?? '',
      active: dto.active,
      statusLabel: dto.active ? 'Activo' : 'Inactivo',
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
