// ─── DTOs ───
export interface SupplierDto {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateSupplierDto {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// ─── ViewModels ───
export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
  statusLabel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierFilters {
  search: string;
  status: 'all' | 'active' | 'inactive';
}
