// ─── DTOs ───
export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: 'active' | 'inactive' | 'suspended';
  roles: string[];        // role names
  createdAt: string;      // ISO
  lastLoginAt?: string;   // ISO
}

// ─── ViewModels ───
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;         // derived: `${firstName} ${lastName}`
  status: UserStatus;
  statusLabel: string;      // 'Activo', 'Inactivo', 'Suspendido'
  roles: string[];
  roleNames: string;        // derived: roles.join(', ') or 'Sin roles'
  createdAt: Date;
  lastLoginAt: Date | null;
}
