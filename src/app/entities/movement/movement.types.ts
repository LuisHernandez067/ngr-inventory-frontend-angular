// ─── Enums ───
export type MovementType =
  | 'ENTRY'
  | 'EXIT'
  | 'TRANSFER'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'RETURN';

export type MovementStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

// ─── DTOs ───
export interface MovementDto {
  id: string;
  type: MovementType;
  status: MovementStatus;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unit: string;
  sourceWarehouseId?: string;
  sourceWarehouseName?: string;
  sourceLocationId?: string;
  sourceLocationName?: string;
  destinationWarehouseId?: string;
  destinationWarehouseName?: string;
  destinationLocationId?: string;
  destinationLocationName?: string;
  reference?: string;
  notes?: string;
  performedBy: string;
  performedByName: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface CreateMovementDto {
  type: MovementType;
  productId: string;
  quantity: number;
  sourceWarehouseId?: string;
  sourceLocationId?: string;
  destinationWarehouseId?: string;
  destinationLocationId?: string;
  reference?: string;
  notes?: string;
}

export interface ValidateMovementDto extends CreateMovementDto {}

export interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  currentStock?: number;
  availableStock?: number;
}

// ─── ViewModels ───
export interface Movement {
  id: string;
  type: MovementType;
  status: MovementStatus;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unit: string;
  sourceWarehouseId: string;
  sourceWarehouseName: string;
  sourceLocationId: string;
  sourceLocationName: string;
  destinationWarehouseId: string;
  destinationWarehouseName: string;
  destinationLocationId: string;
  destinationLocationName: string;
  reference: string;
  notes: string;
  performedBy: string;
  performedByName: string;
  typeLabel: string;       // 'Entrada', 'Salida', 'Transferencia', etc.
  statusLabel: string;     // 'Pendiente', 'Confirmado', 'Cancelado'
  isDestructive: boolean;  // true para EXIT, ADJUSTMENT_OUT
  directionIcon: string;   // 'arrow_downward', 'arrow_upward', 'swap_horiz', etc.
  createdAt: Date;
  confirmedAt: Date | null;
}

export interface MovementFilters {
  search?: string;
  type?: MovementType;
  status?: MovementStatus;
  productId?: string;
  warehouseId?: string;
  dateFrom?: string;
  dateTo?: string;
}
