// ─── DTOs ───
export interface RoleDto {
  id: string;
  name: string;
  description: string;
  permissions: string[];    // permission keys
  isSystem: boolean;        // system roles cannot be deleted
  usersCount: number;
  createdAt: string;
}

// ─── ViewModels ───
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  permissionsCount: number;   // derived: permissions.length
  isSystem: boolean;
  isDeletable: boolean;       // derived: !isSystem
  usersCount: number;
  createdAt: Date;
}
