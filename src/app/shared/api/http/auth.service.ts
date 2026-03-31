import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { AuthStateService } from '../../../core/providers/auth-state.service';
import { PermissionService } from '../../../core/providers/permission.service';
import { AuthMapper } from '../../../entities/auth/auth.mapper';
import type { AuthLoginDto, AuthMeResponseDto, AuthForgotPasswordDto } from '../../../entities/auth/auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);
  private readonly authState = inject(AuthStateService);
  private readonly permissionService = inject(PermissionService);
  private readonly router = inject(Router);

  /**
   * Login: hace POST /auth/login, luego GET /auth/me,
   * carga el estado de sesión y los permisos efectivos.
   */
  login(credentials: AuthLoginDto): Observable<void> {
    return new Observable(observer => {
      this.api.post<void>('/auth/login', credentials).subscribe({
        next: () => {
          this.api.get<AuthMeResponseDto>('/auth/me').subscribe({
            next: (dto) => {
              const user = AuthMapper.toViewModel(dto);
              this.authState.setUser(user);
              this.permissionService.load(dto.permissions);
              observer.next();
              observer.complete();
            },
            error: (err) => observer.error(err),
          });
        },
        error: (err) => observer.error(err),
      });
    });
  }

  /**
   * Bootstrap de sesión: carga el usuario autenticado desde la cookie activa.
   * Llamar al iniciar la app para restaurar sesión.
   */
  bootstrap(): Observable<void> {
    return new Observable(observer => {
      this.api.get<AuthMeResponseDto>('/auth/me').subscribe({
        next: (dto) => {
          const user = AuthMapper.toViewModel(dto);
          this.authState.setUser(user);
          this.permissionService.load(dto.permissions);
          observer.next();
          observer.complete();
        },
        error: (err) => observer.error(err),
      });
    });
  }

  /** Logout: limpia sesión en backend y frontend. */
  logout(): void {
    this.api.post<void>('/auth/logout', {}).subscribe({
      next: () => this.clearAndRedirect(),
      error: () => this.clearAndRedirect(), // limpiar siempre, aunque falle el backend
    });
  }

  /** Recuperación de contraseña — respuesta siempre neutral. */
  forgotPassword(dto: AuthForgotPasswordDto): Observable<void> {
    return this.api.post<void>('/auth/forgot-password', dto);
  }

  private clearAndRedirect(): void {
    this.authState.clearUser();
    this.permissionService.clear();
    this.router.navigate(['/auth/login']);
  }
}
