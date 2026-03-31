// ─── DTOs ───
export interface ProductDto {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName: string;
  unit: string;
  minStock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unit: string;
  minStock: number;
}

export interface UpdateProductDto {
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unit: string;
  minStock: number;
}

export interface ProductStockEntryDto {
  warehouseId: string;
  warehouseName: string;
  locationId: string | null;
  locationName: string | null;
  quantity: number;
}

// ─── ViewModels ───
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  minStock: number;
  active: boolean;
  statusLabel: string;   // 'Activo' | 'Inactivo'
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductStockEntry {
  warehouseId: string;
  warehouseName: string;
  locationId: string | null;
  locationName: string | null;
  quantity: number;
  isBelowMin: boolean;
}

export interface ProductFilters {
  search: string;
  categoryId: string;
  status: 'all' | 'active' | 'inactive';
}
