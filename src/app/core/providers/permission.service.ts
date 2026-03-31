import { Injectable, Signal, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly _permissions = signal<Set<string>>(new Set());

  /** Carga los permisos efectivos del usuario autenticado */
  load(permissions: string[]): void {
    this._permissions.set(new Set(permissions));
  }

  /** Limpia los permisos al hacer logout */
  clear(): void {
    this._permissions.set(new Set());
  }

  /** Verifica si el usuario tiene un permiso efectivo */
  can(permission: string): boolean {
    return this._permissions().has(permission);
  }

  /** Signal computado para uso reactivo en templates */
  canSignal(permission: string): Signal<boolean> {
    return computed(() => this._permissions().has(permission));
  }

  /** Verifica si tiene TODOS los permisos listados */
  canAll(permissions: string[]): boolean {
    return permissions.every(p => this._permissions().has(p));
  }

  /** Verifica si tiene AL MENOS UNO de los permisos listados */
  canAny(permissions: string[]): boolean {
    return permissions.some(p => this._permissions().has(p));
  }
}
