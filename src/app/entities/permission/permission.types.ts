// ─── DTOs ───
export interface PermissionDto {
  key: string;          // e.g. 'inventory.products.read'
  label: string;        // e.g. 'Ver productos'
  module: string;       // e.g. 'inventory'
  group: string;        // e.g. 'products'
  description?: string;
}

// ─── ViewModels ───
export interface Permission {
  key: string;
  label: string;
  module: string;
  group: string;
  description: string;    // '' if not provided
  moduleLabel: string;    // derived: capitalize first letter
  fullLabel: string;      // derived: `${moduleLabel} › ${label}`
}

export interface PermissionGroup {
  module: string;
  moduleLabel: string;
  groups: {
    group: string;
    permissions: Permission[];
  }[];
}
