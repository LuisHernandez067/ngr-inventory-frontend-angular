import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ErrorAdapter } from '../../shared/api/error-adapter';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const appError = ErrorAdapter.fromHttpError(error);

        if (appError.type === 'UNAUTHORIZED') {
          // Sesión inválida o expirada → limpiar y redirigir a login
          router.navigate(['/auth/login'], {
            queryParams: { reason: 'session-expired' },
          });
        }

        // Para FORBIDDEN: NO redirigir. El componente maneja el 403.
        // Para VALIDATION (422): los field errors están en appError.fieldErrors

        return throwError(() => appError);
      }

      return throwError(() => error);
    }),
  );
};
