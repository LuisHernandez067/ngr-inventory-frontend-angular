import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { SupplierService } from '../../../shared/api/http/supplier.service';
import type { AppError, FieldError } from '../../../shared/types';

@Component({
  selector: 'app-supplier-form-page',
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
      <h1 class="page-title">{{ isEdit() ? 'Editar' : 'Nuevo' }} proveedor</h1>
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
            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="name" />
              @if (fieldError('name')) {
                <mat-error>{{ fieldError('name') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Contacto</mat-label>
              <input matInput formControlName="contactName" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" />
              @if (fieldError('email')) {
                <mat-error>{{ fieldError('email') }}</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Teléfono</mat-label>
              <input matInput formControlName="phone" />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Dirección</mat-label>
              <input matInput formControlName="address" />
            </mat-form-field>

            <div class="form-actions col-span-2">
              <button mat-button type="button" routerLink="..">Cancelar</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="submitting()">
                @if (submitting()) { <mat-spinner diameter="20" /> }
                @else { {{ isEdit() ? 'Guardar cambios' : 'Crear proveedor' }} }
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
export class SupplierFormPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly supplierService = inject(SupplierService);

  readonly isEdit = signal(false);
  readonly loadingData = signal(false);
  readonly submitting = signal(false);
  readonly serverError = signal<AppError | null>(null);
  private readonly fieldErrors = signal<FieldError[]>([]);
  private readonly supplierId = signal<string | null>(null);

  readonly form: FormGroup = this.fb.group({
    name:        ['', [Validators.required]],
    contactName: [''],
    email:       ['', [Validators.email]],
    phone:       [''],
    address:     [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEdit.set(!!id);
    this.supplierId.set(id);
    if (id) this.loadSupplier(id);
  }

  fieldError(field: string): string | null {
    return this.fieldErrors().find(e => e.field === field)?.message ?? null;
  }

  private loadSupplier(id: string): void {
    this.loadingData.set(true);
    this.supplierService.getById(id).subscribe({
      next: (supplier) => {
        this.form.patchValue({
          name: supplier.name,
          contactName: supplier.contactName,
          email: supplier.email,
          phone: supplier.phone,
          address: supplier.address,
        });
        this.loadingData.set(false);
      },
      error: (err: AppError) => { this.serverError.set(err); this.loadingData.set(false); },
    });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitting.set(true);
    this.serverError.set(null);
    this.fieldErrors.set([]);

    const dto = this.form.value;
    const request$ = this.isEdit()
      ? this.supplierService.update(this.supplierId()!, dto)
      : this.supplierService.create(dto);

    request$.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['..'], { relativeTo: this.route });
      },
      error: (err: AppError) => {
        this.submitting.set(false);
        if (err.fieldErrors?.length) {
          this.fieldErrors.set(err.fieldErrors);
        } else {
          this.serverError.set(err);
        }
      },
    });
  }
}
