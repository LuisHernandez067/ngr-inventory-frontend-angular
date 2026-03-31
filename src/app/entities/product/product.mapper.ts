import { ProductDto, ProductStockEntryDto, Product, ProductStockEntry } from './product.types';

export class ProductMapper {
  static toViewModel(dto: ProductDto): Product {
    return {
      id: dto.id,
      sku: dto.sku,
      name: dto.name,
      description: dto.description ?? '',
      categoryId: dto.categoryId,
      categoryName: dto.categoryName,
      unit: dto.unit,
      minStock: dto.minStock,
      active: dto.active,
      statusLabel: dto.active ? 'Activo' : 'Inactivo',
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  static stockToViewModel(dto: ProductStockEntryDto, minStock: number): ProductStockEntry {
    return {
      warehouseId: dto.warehouseId,
      warehouseName: dto.warehouseName,
      locationId: dto.locationId,
      locationName: dto.locationName,
      quantity: dto.quantity,
      isBelowMin: dto.quantity < minStock,
    };
  }
}
