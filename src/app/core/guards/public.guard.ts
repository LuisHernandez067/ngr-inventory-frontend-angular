import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../providers/auth-state.service';

/** Redirige al dashboard si el usuario ya está autenticado (ej: ir a /login teniendo sesión) */
export const publicGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
