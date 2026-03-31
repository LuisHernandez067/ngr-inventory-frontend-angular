import type { MovementDto, Movement, MovementType, MovementStatus } from './movement.types';

const TYPE_LABELS: Record<MovementType, string> = {
  ENTRY:          'Entrada',
  EXIT:           'Salida',
  TRANSFER:       'Transferencia',
  ADJUSTMENT_IN:  'Ajuste entrada',
  ADJUSTMENT_OUT: 'Ajuste salida',
  RETURN:         'Devolución',
};

const STATUS_LABELS: Record<MovementStatus, string> = {
  PENDING:   'Pendiente',
  CONFIRMED: 'Confirmado',
  CANCELLED: 'Cancelado',
};

const DIRECTION_ICONS: Record<MovementType, string> = {
  ENTRY:          'arrow_downward',
  EXIT:           'arrow_upward',
  TRANSFER:       'swap_horiz',
  ADJUSTMENT_IN:  'add_circle',
  ADJUSTMENT_OUT: 'remove_circle',
  RETURN:         'undo',
};

const DESTRUCTIVE_TYPES = new Set<MovementType>(['EXIT', 'ADJUSTMENT_OUT']);

export class MovementMapper {
  static fromDto(dto: MovementDto): Movement {
    return {
      id: dto.id,
      type: dto.type,
      status: dto.status,
      productId: dto.productId,
      productName: dto.productName,
      productSku: dto.productSku,
      quantity: dto.quantity,
      unit: dto.unit,
      sourceWarehouseId: dto.sourceWarehouseId ?? '',
      sourceWarehouseName: dto.sourceWarehouseName ?? '',
      sourceLocationId: dto.sourceLocationId ?? '',
      sourceLocationName: dto.sourceLocationName ?? '',
      destinationWarehouseId: dto.destinationWarehouseId ?? '',
      destinationWarehouseName: dto.destinationWarehouseName ?? '',
      destinationLocationId: dto.destinationLocationId ?? '',
      destinationLocationName: dto.destinationLocationName ?? '',
      reference: dto.reference ?? '',
      notes: dto.notes ?? '',
      performedBy: dto.performedBy,
      performedByName: dto.performedByName,
      typeLabel: TYPE_LABELS[dto.type],
      statusLabel: STATUS_LABELS[dto.status],
      isDestructive: DESTRUCTIVE_TYPES.has(dto.type),
      directionIcon: DIRECTION_ICONS[dto.type],
      createdAt: new Date(dto.createdAt),
      confirmedAt: dto.confirmedAt ? new Date(dto.confirmedAt) : null,
    };
  }

  static fromDtoList(dtos: MovementDto[]): Movement[] {
    return dtos.map(dto => MovementMapper.fromDto(dto));
  }
}
