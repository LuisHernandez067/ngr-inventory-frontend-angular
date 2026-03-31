import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../shared/api/http/user.service';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-user-create-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/admin/users">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="page-title">Nuevo usuario</h1>
    </div>

    <mat-card class="form-card">
      <mat-card-content>
        @if (serverError()) {
          <div class="form-alert" role="alert">
            <mat-icon>error_outline</mat-icon>
            {{ serverError() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="firstName" />
            @if (form.get('firstName')?.invalid && form.get('firstName')?.touched) {
              <mat-error>El nombre es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Apellido</mat-label>
            <input matInput formControlName="lastName" />
            @if (form.get('lastName')?.invalid && form.get('lastName')?.touched) {
              <mat-error>El apellido es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" />
            @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
              <mat-error>El email es requerido</mat-error>
            }
            @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
              <mat-error>Ingresá un email válido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Contraseña</mat-label>
            <input matInput formControlName="password" type="password" />
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>La contraseña es requerida</mat-error>
            }
            @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
              <mat-error>Mínimo 8 caracteres</mat-error>
            }
          </mat-form-field>

          <div class="form-actions col-span-2">
            <button mat-button type="button" routerLink="/admin/users">Cancelar</button>
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <mat-spinner diameter="20" />
              } @else {
                Crear usuario
              }
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header  { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .page-title   { margin: 0; font-size: 24px; font-weight: 500; }
    .form-card    { max-width: 640px; }
    .form-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .col-span-2   { grid-column: span 2; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }
    .form-alert   { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fdecea; color: #c62828; border-radius: 4px; margin-bottom: 16px; }
  `],
})
export class UserCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);

  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName:  ['', [Validators.required]],
    email:     ['', [Validators.required, Validators.email]],
    password:  ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    const { email, firstName, lastName, password } = this.form.getRawValue();
    this.userService.create({ email, firstName, lastName, password }).subscribe({
      next: () => {
        this.router.navigate(['/admin/users']);
      },
      error: (err: AppError) => {
        this.serverError.set(err.title ?? 'Error al crear el usuario');
        this.submitting.set(false);
      },
    });
  }
}
