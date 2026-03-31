// ─── DTOs ───
export interface LocationDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  warehouseId: string;
  warehouseName: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationDto {
  code: string;
  name: string;
  warehouseId: string;
  description?: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
}

export interface UpdateLocationDto {
  name?: string;
  description?: string;
  aisle?: string;
  shelf?: string;
  bin?: string;
}

// ─── ViewModels ───
export interface Location {
  id: string;
  code: string;
  name: string;
  description: string;
  warehouseId: string;
  warehouseName: string;
  aisle: string;
  shelf: string;
  bin: string;
  isActive: boolean;
  statusLabel: string;   // 'Activo' | 'Inactivo'
  breadcrumb: string;    // e.g. "Almacén Central > A1 > E2 > B3"
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationFilters {
  search?: string;
  warehouseId?: string;
  isActive?: boolean;
}
