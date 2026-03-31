import type {
  PhysicalCountSummaryDto,
  PhysicalCountItemDto,
  PhysicalCountDetailDto,
  PhysicalCount,
  PhysicalCountItem,
  PhysicalCountDetail,
  PhysicalCountStatus,
  PhysicalCountItemStatus,
} from './count.types';

const STATUS_LABELS: Record<PhysicalCountStatus, string> = {
  draft:       'Borrador',
  in_progress: 'En progreso',
  completed:   'Completado',
  cancelled:   'Cancelado',
};

const ITEM_STATUS_LABELS: Record<PhysicalCountItemStatus, string> = {
  pending:     'Pendiente',
  counted:     'Contado',
  discrepancy: 'Diferencia',
};

export class CountMapper {
  static fromSummaryDto(dto: PhysicalCountSummaryDto): PhysicalCount {
    const totalItems = dto.totalItems ?? 0;
    return {
      id:               dto.id,
      code:             dto.code,
      status:           dto.status,
      statusLabel:      CountMapper.statusLabel(dto.status),
      warehouseId:      dto.warehouseId,
      warehouseName:    dto.warehouseName,
      createdBy:        dto.createdBy,
      createdAt:        new Date(dto.createdAt),
      completedAt:      dto.completedAt ? new Date(dto.completedAt) : null,
      totalItems,
      countedItems:     dto.countedItems,
      discrepancyItems: dto.discrepancyItems,
      progressPercent:  totalItems > 0
        ? Math.round((dto.countedItems / totalItems) * 100)
        : 0,
    };
  }

  static fromItemDto(dto: PhysicalCountItemDto): PhysicalCountItem {
    return {
      id:            dto.id,
      productId:     dto.productId,
      productCode:   dto.productCode,
      productName:   dto.productName,
      locationId:    dto.locationId,
      locationCode:  dto.locationCode,
      theoreticalQty: dto.theoreticalQty,
      countedQty:    dto.countedQty,
      difference:    dto.difference,
      status:        dto.status,
      statusLabel:   ITEM_STATUS_LABELS[dto.status],
      hasDiscrepancy: dto.status === 'discrepancy',
    };
  }

  static fromDetailDto(dto: PhysicalCountDetailDto): PhysicalCountDetail {
    return {
      ...CountMapper.fromSummaryDto(dto),
      items: dto.items.map(item => CountMapper.fromItemDto(item)),
    };
  }

  private static statusLabel(status: string): string {
    return STATUS_LABELS[status as PhysicalCountStatus] ?? status;
  }
}
