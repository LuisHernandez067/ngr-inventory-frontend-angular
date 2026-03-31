import { Component, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../shared/api/http/auth.service';

@Component({
  selector: 'app-forgot-password-page',
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
    <div class="forgot-container">
      <mat-card class="forgot-card">
        <mat-card-header>
          <mat-card-title>Recuperar contraseña</mat-card-title>
          <mat-card-subtitle>
            Ingresá tu email y te enviamos las instrucciones.
          </mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          @if (submitted()) {
            <!-- Mensaje SIEMPRE neutro — nunca revelar si el email existe -->
            <div class="forgot-success" role="status" aria-live="polite">
              <mat-icon color="primary">mark_email_read</mat-icon>
              <p>
                Si existe una cuenta con ese email, recibirás las instrucciones
                para restablecer tu contraseña en los próximos minutos.
              </p>
              <a routerLink="/auth/login" mat-button color="primary">
                Volver al inicio de sesión
              </a>
            </div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
              <mat-form-field appearance="outline" class="forgot-field">
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

              <div class="forgot-actions">
                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  class="forgot-submit"
                  [disabled]="loading()"
                >
                  @if (loading()) {
                    <mat-spinner diameter="20" />
                  } @else {
                    Enviar instrucciones
                  }
                </button>
              </div>
            </form>
          }
        </mat-card-content>

        @if (!submitted()) {
          <mat-card-actions>
            <a routerLink="/auth/login" mat-button>
              Volver al inicio de sesión
            </a>
          </mat-card-actions>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .forgot-container {
      width: 100%;
      max-width: 400px;
      padding: 16px;
    }
    .forgot-card {
      padding: 8px;
    }
    .forgot-field {
      width: 100%;
      margin-top: 16px;
      display: block;
    }
    .forgot-actions {
      margin-top: 24px;
    }
    .forgot-submit {
      width: 100%;
      height: 44px;
    }
    .forgot-success {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 16px;
      padding: 24px 0;
    }
    .forgot-success mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }
  `],
})
export class ForgotPasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly loading = signal(false);
  readonly submitted = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email } = this.form.value as { email: string };

    this.authService.forgotPassword({ email }).subscribe({
      // En ambos casos (éxito o error de backend) mostramos el mensaje neutro
      next: () => {
        this.loading.set(false);
        this.submitted.set(true);
      },
      error: () => {
        // Silenciar el error — NUNCA revelar si el email existe o no
        this.loading.set(false);
        this.submitted.set(true);
      },
    });
  }
}
