// ─── DTOs ───
export interface PhysicalCountSummaryDto {
  id: string;
  code: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  warehouseId: string;
  warehouseName: string;
  createdBy: string;
  createdAt: string;      // ISO
  completedAt?: string;   // ISO
  totalItems: number;
  countedItems: number;
  discrepancyItems: number;
}

export interface PhysicalCountItemDto {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  locationId: string;
  locationCode: string;
  theoreticalQty: number;
  countedQty: number | null;
  difference: number | null;    // countedQty - theoreticalQty
  status: 'pending' | 'counted' | 'discrepancy';
}

export interface PhysicalCountDetailDto extends PhysicalCountSummaryDto {
  items: PhysicalCountItemDto[];
}

// ─── ViewModels ───
export type PhysicalCountStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';
export type PhysicalCountItemStatus = 'pending' | 'counted' | 'discrepancy';

export interface PhysicalCount {
  id: string;
  code: string;
  status: PhysicalCountStatus;
  statusLabel: string;      // 'Borrador', 'En progreso', 'Completado', 'Cancelado'
  warehouseId: string;
  warehouseName: string;
  createdBy: string;
  createdAt: Date;
  completedAt: Date | null;
  totalItems: number;
  countedItems: number;
  discrepancyItems: number;
  progressPercent: number;  // Math.round((countedItems / totalItems) * 100) or 0 if totalItems=0
}

export interface PhysicalCountItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  locationId: string;
  locationCode: string;
  theoreticalQty: number;
  countedQty: number | null;
  difference: number | null;
  status: PhysicalCountItemStatus;
  statusLabel: string;        // 'Pendiente', 'Contado', 'Diferencia'
  hasDiscrepancy: boolean;    // status === 'discrepancy'
}

export interface PhysicalCountDetail extends PhysicalCount {
  items: PhysicalCountItem[];
}
