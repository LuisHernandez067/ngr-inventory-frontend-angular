import { CategoryDto, Category } from './category.types';

export class CategoryMapper {
  static toViewModel(dto: CategoryDto): Category {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description ?? '',
      active: dto.active,
      statusLabel: dto.active ? 'Activo' : 'Inactivo',
      productCount: dto.productCount,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
