import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { RoleService } from '../../../shared/api/http/role.service';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-role-create-page',
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
      <button mat-icon-button routerLink="/admin/roles">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="page-title">Nuevo rol</h1>
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
          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="name" />
            @if (form.get('name')?.invalid && form.get('name')?.touched) {
              <mat-error>El nombre es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Descripción</mat-label>
            <textarea matInput formControlName="description" rows="3"></textarea>
            @if (form.get('description')?.invalid && form.get('description')?.touched) {
              <mat-error>La descripción es requerida</mat-error>
            }
          </mat-form-field>

          <div class="form-actions col-span-2">
            <button mat-button type="button" routerLink="/admin/roles">Cancelar</button>
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <mat-spinner diameter="20" />
              } @else {
                Crear rol
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
export class RoleCreatePage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleService);

  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    name:        ['', [Validators.required]],
    description: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    const { name, description } = this.form.getRawValue();
    this.roleService.create({ name, description }).subscribe({
      next: () => {
        this.router.navigate(['/admin/roles']);
      },
      error: (err: AppError) => {
        this.serverError.set(err.title ?? 'Error al crear el rol');
        this.submitting.set(false);
      },
    });
  }
}
