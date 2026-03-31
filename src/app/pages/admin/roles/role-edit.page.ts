import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  selector: 'app-role-edit-page',
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
      <h1 class="page-title">Editar rol</h1>
    </div>

    @if (loadingData()) {
      <div class="state-center"><mat-spinner diameter="48" /></div>
    } @else if (loadError()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ loadError() }}</p>
        <button mat-button (click)="loadRole()">Reintentar</button>
      </div>
    } @else {
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
                  Guardar cambios
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .page-header  { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .page-title   { margin: 0; font-size: 24px; font-weight: 500; }
    .form-card    { max-width: 640px; }
    .form-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .col-span-2   { grid-column: span 2; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }
    .form-alert   { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fdecea; color: #c62828; border-radius: 4px; margin-bottom: 16px; }
    .state-center { display: flex; justify-content: center; align-items: center; padding: 64px; }
    .state-error  { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px; text-align: center; }
  `],
})
export class RoleEditPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roleService = inject(RoleService);

  readonly loadingData = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);
  private readonly roleId = signal<string>('');

  readonly form: FormGroup = this.fb.group({
    name:        ['', [Validators.required]],
    description: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.roleId.set(id);
    this.loadRole();
  }

  loadRole(): void {
    const id = this.roleId();
    if (!id) return;
    this.loadingData.set(true);
    this.loadError.set(null);
    this.roleService.getById(id).subscribe({
      next: (role) => {
        this.form.patchValue({
          name:        role.name,
          description: role.description,
        });
        this.loadingData.set(false);
      },
      error: (err: AppError) => {
        this.loadError.set(err.title ?? 'Error al cargar el rol');
        this.loadingData.set(false);
      },
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    const { name, description } = this.form.getRawValue();
    this.roleService.update(this.roleId(), { name, description }).subscribe({
      next: () => {
        this.router.navigate(['/admin/roles']);
      },
      error: (err: AppError) => {
        this.serverError.set(err.title ?? 'Error al actualizar el rol');
        this.submitting.set(false);
      },
    });
  }
}
