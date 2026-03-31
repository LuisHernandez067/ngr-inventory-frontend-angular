// ─── DTOs ───
export interface WarehouseDto {
  id: string;
  code: string;
  name: string;
  description?: string;
  address?: string;
  isActive: boolean;
  locationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseDto {
  code: string;
  name: string;
  description?: string;
  address?: string;
}

export interface UpdateWarehouseDto {
  name?: string;
  description?: string;
  address?: string;
}

// ─── ViewModels ───
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description: string;
  address: string;
  isActive: boolean;
  locationCount: number;
  statusLabel: string;   // 'Activo' | 'Inactivo'
  createdAt: Date;
  updatedAt: Date;
}

export interface WarehouseFilters {
  search?: string;
  isActive?: boolean;
}
