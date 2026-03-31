import { LocationDto, Location } from './location.types';

export class LocationMapper {
  static fromDto(dto: LocationDto): Location {
    const parts = [dto.warehouseName, dto.aisle, dto.shelf, dto.bin].filter(Boolean) as string[];
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      description: dto.description ?? '',
      warehouseId: dto.warehouseId,
      warehouseName: dto.warehouseName,
      aisle: dto.aisle ?? '',
      shelf: dto.shelf ?? '',
      bin: dto.bin ?? '',
      isActive: dto.isActive,
      statusLabel: dto.isActive ? 'Activo' : 'Inactivo',
      breadcrumb: parts.join(' > '),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  static fromDtoList(dtos: LocationDto[]): Location[] {
    return dtos.map(dto => LocationMapper.fromDto(dto));
  }
}
