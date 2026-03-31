import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../providers/permission.service';

/**
 * Factory guard para verificar permiso efectivo en rutas.
 *
 * Uso en routes:
 *   canActivate: [permissionGuard('inventory.movements.read')]
 */
export function permissionGuard(permission: string): CanActivateFn {
  return () => {
    const permissionService = inject(PermissionService);
    const router = inject(Router);

    if (permissionService.can(permission)) {
      return true;
    }

    return router.createUrlTree(['/forbidden']);
  };
}
