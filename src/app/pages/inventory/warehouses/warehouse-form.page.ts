import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { WarehouseService } from '../../../shared/api/http/warehouse.service';
import type { AppError, FieldError } from '../../../shared/types';

@Component({
  selector: 'app-warehouse-form-page',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatProgressSpinnerModule, MatIconModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="..">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="page-title">{{ isEdit() ? 'Editar' : 'Nuevo' }} almacén</h1>
    </div>

    @if (loadingData()) {
      <div class="state-center"><mat-spinner diameter="48" /></div>
    } @else {
      <mat-card class="form-card">
        <mat-card-content>
          @if (serverError()) {
            <div class="form-alert" role="alert">
              <mat-icon>error_outline</mat-icon>
              {{ serverError()!.title }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>Código</mat-label>
              <input matInput formControlName="code" />
              @if (fieldError('code')) {
                <mat-error>{{ fieldError('code') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="name" />
              @if (fieldError('name')) {
                <mat-error>{{ fieldError('name') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Descripción</mat-label>
              <textarea matInput formControlName="description" rows="3"></textarea>
            </mat-form-field>

            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Dirección</mat-label>
              <input matInput formControlName="address" placeholder="Calle, número, ciudad..." />
              @if (fieldError('address')) {
                <mat-error>{{ fieldError('address') }}</mat-error>
              }
            </mat-form-field>

            <div class="form-actions col-span-2">
              <button mat-button type="button" routerLink="..">Cancelar</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="submitting()">
                @if (submitting()) { <mat-spinner diameter="20" /> }
                @else { {{ isEdit() ? 'Guardar cambios' : 'Crear almacén' }} }
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
    .form-card    { max-width: 800px; }
    .form-grid    { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .col-span-2   { grid-column: span 2; }
    .form-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; }
    .form-alert   { display: flex; align-items: center; gap: 8px; padding: 12px; background: #fdecea; color: #c62828; border-radius: 4px; margin-bottom: 16px; }
    .state-center { display: flex; justify-content: center; align-items: center; padding: 64px; }
  `],
})
export class WarehouseFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly warehouseService = inject(WarehouseService);

  readonly isEdit = signal(false);
  readonly loadingData = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<AppError | null>(null);
  private readonly _fieldErrors = signal<FieldError[]>([]);
  private readonly warehouseId = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    code:        ['', [Validators.required]],
    name:        ['', [Validators.required]],
    description: [''],
    address:     [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);
    this.warehouseId.set(id);
    if (id) this.loadWarehouse(id);
  }

  fieldError(field: string): string | null {
    return this._fieldErrors().find(e => e.field === field)?.message ?? null;
  }

  private loadWarehouse(id: string): void {
    this.loadingData.set(true);
    this.warehouseService.getById(id).subscribe({
      next: (warehouse) => {
        this.form.patchValue({
          code: warehouse.code,
          name: warehouse.name,
          description: warehouse.description,
          address: warehouse.address,
        });
        this.form.get('code')?.disable();
        this.loadingData.set(false);
      },
      error: (err: AppError) => { this.serverError.set(err); this.loadingData.set(false); },
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.serverError.set(null);
    this._fieldErrors.set([]);

    const raw = this.form.getRawValue();
    const request$ = this.isEdit()
      ? this.warehouseService.update(this.warehouseId()!, { name: raw.name, description: raw.description, address: raw.address })
      : this.warehouseService.create({ code: raw.code, name: raw.name, description: raw.description, address: raw.address });

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (err: AppError) => {
        this.submitting.set(false);
        if (err.fieldErrors?.length) {
          this._fieldErrors.set(err.fieldErrors);
        } else {
          this.serverError.set(err);
        }
      },
    });
  }
}
