import { WarehouseDto, Warehouse } from './warehouse.types';

export class WarehouseMapper {
  static fromDto(dto: WarehouseDto): Warehouse {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? '',
      address: dto.address ?? '',
      isActive: dto.isActive,
      locationCount: dto.locationCount,
      statusLabel: dto.isActive ? 'Activo' : 'Inactivo',
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  static fromDtoList(dtos: WarehouseDto[]): Warehouse[] {
    return dtos.map(dto => WarehouseMapper.fromDto(dto));
  }
}
