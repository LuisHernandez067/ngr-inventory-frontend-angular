import { Component, OnInit, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../shared/api/http/auth.service';
import { AppError } from '../../../shared/types';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>NGR Inventory</mat-card-title>
          <mat-card-subtitle>Iniciá sesión para continuar</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (sessionExpired()) {
            <div class="login-alert login-alert--warning" role="alert">
              <mat-icon>schedule</mat-icon>
              Tu sesión expiró. Ingresá nuevamente.
            </div>
          }

          @if (error()) {
            <div class="login-alert login-alert--error" role="alert">
              <mat-icon>error_outline</mat-icon>
              {{ error()!.title }}
              @if (error()!.detail) {
                <span class="login-alert__detail">{{ error()!.detail }}</span>
              }
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            <mat-form-field appearance="outline" class="login-field">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="usuario@empresa.com"
              />
              @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
                <mat-error>El email es requerido</mat-error>
              }
              @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
                <mat-error>Ingresá un email válido</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="login-field">
              <mat-label>Contraseña</mat-label>
              <input
                matInput
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                autocomplete="current-password"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePassword()"
                [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
                <mat-error>La contraseña es requerida</mat-error>
              }
            </mat-form-field>

            <div class="login-actions">
              <button
                mat-flat-button
                color="primary"
                type="submit"
                class="login-submit"
                [disabled]="loading()"
              >
                @if (loading()) {
                  <mat-spinner diameter="20" />
                } @else {
                  Ingresar
                }
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <a routerLink="/auth/forgot-password" mat-button>
            ¿Olvidaste tu contraseña?
          </a>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      width: 100%;
      max-width: 400px;
      padding: 16px;
    }
    .login-card {
      padding: 8px;
    }
    .login-field {
      width: 100%;
      margin-top: 16px;
      display: block;
    }
    .login-actions {
      margin-top: 24px;
    }
    .login-submit {
      width: 100%;
      height: 44px;
    }
    .login-alert {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    .login-alert--error {
      background: #fdecea;
      color: #c62828;
    }
    .login-alert--warning {
      background: #fff8e1;
      color: #e65100;
    }
    .login-alert__detail {
      display: block;
      font-size: 12px;
      margin-top: 4px;
      opacity: 0.8;
    }
  `],
})
export class LoginPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);
  readonly sessionExpired = signal(false);
  readonly showPassword = signal(false);

  ngOnInit(): void {
    const reason = this.route.snapshot.queryParamMap.get('reason');
    if (reason === 'session-expired') {
      this.sessionExpired.set(true);
    }
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.sessionExpired.set(false);

    const { email, password } = this.form.value as { email: string; password: string };

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: AppError) => {
        this.loading.set(false);
        this.error.set(err);
      },
    });
  }
}
