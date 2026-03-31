import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CountService } from '../../../shared/api/http/count.service';
import { WarehouseService } from '../../../shared/api/http/warehouse.service';
import type { Warehouse } from '../../../entities/warehouse/warehouse.types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-count-create-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/inventory/counts">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="page-title">Nuevo conteo físico</h1>
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
            <mat-label>Almacén</mat-label>
            <mat-select formControlName="warehouseId">
              @for (w of warehouses(); track w.id) {
                <mat-option [value]="w.id">{{ w.name }}</mat-option>
              }
            </mat-select>
            @if (form.get('warehouseId')?.invalid && form.get('warehouseId')?.touched) {
              <mat-error>El almacén es requerido</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="col-span-2">
            <mat-label>Notas (opcional)</mat-label>
            <textarea matInput formControlName="notes" rows="3" placeholder="Observaciones del conteo..."></textarea>
          </mat-form-field>

          <div class="form-actions col-span-2">
            <button mat-button type="button" routerLink="/inventory/counts">Cancelar</button>
            <button
              mat-flat-button
              color="primary"
              type="submit"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <mat-spinner diameter="20" />
              } @else {
                Crear conteo
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
export class CountCreatePage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly countService = inject(CountService);
  private readonly warehouseService = inject(WarehouseService);

  readonly warehouses = signal<Warehouse[]>([]);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    warehouseId: ['', [Validators.required]],
    notes:       [''],
  });

  ngOnInit(): void {
    this.loadWarehouses();
  }

  private loadWarehouses(): void {
    this.warehouseService.getAll({ page: 1, pageSize: 100, isActive: true }).subscribe({
      next: ({ data }) => this.warehouses.set(data),
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

    const { warehouseId, notes } = this.form.getRawValue();
    this.countService.create({
      warehouseId,
      ...(notes ? { notes } : {}),
    }).subscribe({
      next: (count) => {
        this.router.navigate(['/inventory/counts', count.id]);
      },
      error: (err: AppError) => {
        this.serverError.set(err.title ?? 'Error al crear el conteo');
        this.submitting.set(false);
      },
    });
  }
}
