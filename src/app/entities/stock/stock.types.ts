// ─── DTOs ───
export interface StockEntryDto {
  productId: string;
  productName: string;
  productSku: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  minStock: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  warehouseId?: string;
  warehouseName?: string;
  locationId?: string;
  locationName?: string;
}

// ─── ViewModels ───
export type StockStatus = 'ok' | 'low' | 'critical' | 'out';

export interface StockEntry {
  productId: string;
  productName: string;
  productSku: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  minStock: number;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  warehouseId: string;
  warehouseName: string;
  locationId: string;
  locationName: string;
  // Derived
  status: StockStatus;
  statusLabel: string;     // 'OK', 'Stock bajo', 'Stock crítico', 'Sin stock'
  statusColor: string;     // 'ok' | 'warn' | 'error'
  availabilityPct: number; // available / (total || 1) * 100
}

export interface StockFilters {
  search?: string;
  categoryId?: string;
  warehouseId?: string;
  locationId?: string;
  status?: StockStatus;
}
