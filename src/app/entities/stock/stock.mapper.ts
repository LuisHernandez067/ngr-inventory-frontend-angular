import type { StockEntryDto, StockEntry, StockStatus } from './stock.types';

function deriveStatus(dto: StockEntryDto): StockStatus {
  if (dto.availableQuantity <= 0) return 'out';
  if (dto.minStock > 0) {
    if (dto.availableQuantity <= dto.minStock * 0.25) return 'critical';
    if (dto.availableQuantity <= dto.minStock) return 'low';
  }
  return 'ok';
}

const STATUS_LABELS: Record<StockStatus, string> = {
  ok:       'OK',
  low:      'Stock bajo',
  critical: 'Stock crítico',
  out:      'Sin stock',
};

const STATUS_COLORS: Record<StockStatus, string> = {
  ok:       'ok',
  low:      'warn',
  critical: 'error',
  out:      'error',
};

export class StockMapper {
  static fromDto(dto: StockEntryDto): StockEntry {
    const status = deriveStatus(dto);
    const total = dto.totalQuantity || 1;
    return {
      productId:         dto.productId,
      productName:       dto.productName,
      productSku:        dto.productSku,
      categoryId:        dto.categoryId,
      categoryName:      dto.categoryName,
      unit:              dto.unit,
      minStock:          dto.minStock,
      totalQuantity:     dto.totalQuantity,
      reservedQuantity:  dto.reservedQuantity,
      availableQuantity: dto.availableQuantity,
      warehouseId:       dto.warehouseId   ?? '',
      warehouseName:     dto.warehouseName ?? '',
      locationId:        dto.locationId    ?? '',
      locationName:      dto.locationName  ?? '',
      status,
      statusLabel:       STATUS_LABELS[status],
      statusColor:       STATUS_COLORS[status],
      availabilityPct:   Math.round((dto.availableQuantity / total) * 100),
    };
  }

  static fromDtoList(dtos: StockEntryDto[]): StockEntry[] {
    return dtos.map(dto => StockMapper.fromDto(dto));
  }
}
