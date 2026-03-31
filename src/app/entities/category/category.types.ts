// ─── DTOs ───
export interface CategoryDto {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name: string;
  description?: string;
}

// ─── ViewModels ───
export interface Category {
  id: string;
  name: string;
  description: string;
  active: boolean;
  statusLabel: string;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}
