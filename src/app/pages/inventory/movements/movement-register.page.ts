import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { DatePipe } from '@angular/common';
import { MovementService } from '../../../shared/api/http/movement.service';
import { ProductService } from '../../../shared/api/http/product.service';
import { WarehouseService } from '../../../shared/api/http/warehouse.service';
import { LocationService } from '../../../shared/api/http/location.service';
import { ConfirmDialogComponent } from '../../../widgets/confirm-dialog/confirm-dialog.component';
import type { MovementType, ValidationResult } from '../../../entities/movement/movement.types';
import type { Product } from '../../../entities/product/product.types';
import type { Warehouse } from '../../../entities/warehouse/warehouse.types';
import type { Location } from '../../../entities/location/location.types';
import type { AppError, FieldError } from '../../../shared/types';

type FormStep = 'form' | 'validating' | 'preview' | 'submitting' | 'done';

const MOVEMENT_TYPES: Array<{ value: MovementType; label: string; needsSource: boolean; needsDest: boolean }> = [
  { value: 'ENTRY',          label: 'Entrada',        needsSource: false, needsDest: true  },
  { value: 'EXIT',           label: 'Salida',          needsSource: true,  needsDest: false },
  { value: 'TRANSFER',       label: 'Transferencia',   needsSource: true,  needsDest: true  },
  { value: 'ADJUSTMENT_IN',  label: 'Ajuste entrada',  needsSource: false, needsDest: true  },
  { value: 'ADJUSTMENT_OUT', label: 'Ajuste salida',   needsSource: true,  needsDest: false },
  { value: 'RETURN',         label: 'Devolución',      needsSource: false, needsDest: true  },
];

@Component({
  selector: 'app-movement-register-page',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule, DatePipe,
    MatButtonModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatIconModule, MatDividerModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="..">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="page-title">Registrar movimiento</h1>
    </div>

    <!-- STEP: form -->
    @if (step() === 'form' || step() === 'validating') {
      <mat-card class="form-card">
        <mat-card-content>
          @if (serverError()) {
            <div class="form-alert" role="alert">
              <mat-icon>error_outline</mat-icon>
              {{ serverError()!.title }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="validate()" novalidate class="form-grid">

            <!-- Tipo de movimiento -->
            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Tipo de movimiento</mat-label>
              <mat-select formControlName="type" (selectionChange)="onTypeChange()">
                @for (t of movementTypes; track t.value) {
                  <mat-option [value]="t.value">{{ t.label }}</mat-option>
                }
              </mat-select>
              @if (fieldError('type')) { <mat-error>{{ fieldError('type') }}</mat-error> }
            </mat-form-field>

            <!-- Producto -->
            <mat-form-field appearance="outline" class="col-span-2">
              <mat-label>Producto</mat-label>
              <mat-select formControlName="productId">
                @for (p of products(); track p.id) {
                  <mat-option [value]="p.id">{{ p.name }} ({{ p.sku }})</mat-option>
                }
              </mat-select>
              @if (fieldError('productId')) { <mat-error>{{ fieldError('productId') }}</mat-error> }
            </mat-form-field>

            <!-- Cantidad -->
            <mat-form-field appearance="outline">
              <mat-label>Cantidad</mat-label>
              <input matInput type="number" formControlName="quantity" min="1" />
              @if (fieldError('quantity')) { <mat-error>{{ fieldError('quantity') }}</mat-error> }
            </mat-form-field>

            <!-- Origen (si aplica) -->
            @if (needsSource()) {
              <mat-form-field appearance="outline">
                <mat-label>Almacén origen</mat-label>
                <mat-select formControlName="sourceWarehouseId" (selectionChange)="onSourceWarehouseChange()">
                  @for (w of warehouses(); track w.id) {
                    <mat-option [value]="w.id">{{ w.name }}</mat-option>
                  }
                </mat-select>
                @if (fieldError('sourceWarehouseId')) { <mat-error>{{ fieldError('sourceWarehouseId') }}</mat-error> }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Ubicación origen</mat-label>
                <mat-select formControlName="sourceLocationId">
                  @for (l of sourceLocations(); track l.id) {
                    <mat-option [value]="l.id">{{ l.name }}</mat-option>
                  }
                </mat-select>
                @if (fieldError('sourceLocationId')) { <mat-error>{{ fieldError('sourceLocationId') }}</mat-error> }
              </mat-form-field>
            }

            <!-- Destino (si aplica) -->
            @if (needsDest()) {
              <mat-form-field appearance="outline">
                <mat-label>Almacén destino</mat-label>
                <mat-select formControlName="destinationWarehouseId" (selectionChange)="onDestWarehouseChange()">
                  @for (w of warehouses(); track w.id) {
                    <mat-option [value]="w.id">{{ w.name }}</mat-option>
                  }
                </mat-select>
                @if (fieldError('destinationWarehouseId')) { <mat-error>{{ fieldError('destinationWarehouseId') }}</mat-error> }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Ubicación destino</mat-label>
                <mat-select formControlName="destinationLocationId">
                  @for (l of destLocations(); track l.id) {
                    <mat-option [value]="l.id">{{ l.name }}</mat-option>
                  }
                </mat-select>
                @if (fieldError('destinationLocationId')) { <mat-error>{{ fieldError('destinationLocationId') }}</mat-error> }
              </mat-form-field>
            }

            <!-- Referencia y notas -->
            <mat-form-field appearance="outline">
              <mat-label>Referencia</mat-label>
              <input matInput formControlName="reference" placeholder="N° orden, remito..." />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Notas</mat-label>
              <input matInput formControlName="notes" />
            </mat-form-field>

            <div class="form-actions col-span-2">
              <button mat-button type="button" routerLink="..">Cancelar</button>
              <button mat-flat-button color="primary" type="submit" [disabled]="step() === 'validating'">
                @if (step() === 'validating') { <mat-spinner diameter="20" /> }
                @else { Validar movimiento }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }

    <!-- STEP: preview (resultado de validación) -->
    @if (step() === 'preview') {
      <mat-card class="form-card">
        <mat-card-content>
          <h2 class="preview-title">
            <mat-icon color="primary">check_circle</mat-icon>
            Vista previa del movimiento
          </h2>

          @if (validationResult()?.warnings?.length) {
            <div class="validation-warnings" role="alert">
              <mat-icon>warning</mat-icon>
              <div>
                <strong>Advertencias:</strong>
                @for (w of validationResult()!.warnings; track w.field) {
                  <p>{{ w.message }}</p>
                }
              </div>
            </div>
          }

          @if (validationResult()?.currentStock !== undefined) {
            <div class="stock-info">
              <span>Stock actual: <strong>{{ validationResult()!.currentStock }}</strong></span>
              <span>Stock disponible: <strong>{{ validationResult()!.availableStock }}</strong></span>
            </div>
          }

          <mat-divider class="divider" />

          <div class="preview-grid">
            <div class="preview-field"><span class="label">Tipo</span><span>{{ selectedTypeLabel() }}</span></div>
            <div class="preview-field"><span class="label">Cantidad</span><span>{{ form.value.quantity }}</span></div>
            @if (form.value.reference) {
              <div class="preview-field"><span class="label">Referencia</span><span>{{ form.value.reference }}</span></div>
            }
            @if (form.value.notes) {
              <div class="preview-field col-span-2"><span class="label">Notas</span><span>{{ form.value.notes }}</span></div>
            }
          </div>

          <div class="form-actions">
            <button mat-button (click)="step.set('form')">Volver a editar</button>
            <button mat-flat-button
              [color]="isDestructiveType() ? 'warn' : 'primary'"
              (click)="confirmAndSubmit()"
              [disabled]="step() === 'submitting'">
              @if (step() === 'submitting') { <mat-spinner diameter="20" /> }
              @else { Confirmar y registrar }
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    }

    <!-- STEP: done -->
    @if (step() === 'done') {
      <div class="state-success">
        <mat-icon color="primary">check_circle</mat-icon>
        <h2>Movimiento registrado</h2>
        <p>El movimiento fue registrado exitosamente.</p>
        <div class="done-actions">
          <button mat-button routerLink="..">Ver todos los movimientos</button>
          <button mat-flat-button color="primary" (click)="resetForm()">Registrar otro</button>
        </div>
      </div>
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
    .preview-title { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }
    .validation-warnings { display: flex; gap: 8px; background: #fff8e1; border-radius: 4px; padding: 12px; margin-bottom: 16px; color: #f57f17; }
    .stock-info { display: flex; gap: 24px; margin-bottom: 16px; font-size: 14px; }
    .divider { margin: 16px 0; }
    .preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .preview-field { display: flex; flex-direction: column; gap: 2px; }
    .preview-field .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: .05em; }
    .state-success { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 64px; text-align: center; }
    .state-success mat-icon { font-size: 64px; width: 64px; height: 64px; }
    .done-actions { display: flex; gap: 12px; }
  `],
})
export class MovementRegisterPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly movementService = inject(MovementService);
  private readonly productService = inject(ProductService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly locationService = inject(LocationService);
  private readonly dialog = inject(MatDialog);

  readonly movementTypes = MOVEMENT_TYPES;
  readonly step = signal<FormStep>('form');
  readonly serverError = signal<AppError | null>(null);
  readonly validationResult = signal<ValidationResult | null>(null);
  readonly products = signal<Product[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly sourceLocations = signal<Location[]>([]);
  readonly destLocations = signal<Location[]>([]);
  private readonly _fieldErrors = signal<FieldError[]>([]);

  readonly needsSource = computed(() => {
    const type = this.form?.get('type')?.value as MovementType;
    return MOVEMENT_TYPES.find(t => t.value === type)?.needsSource ?? false;
  });

  readonly needsDest = computed(() => {
    const type = this.form?.get('type')?.value as MovementType;
    return MOVEMENT_TYPES.find(t => t.value === type)?.needsDest ?? false;
  });

  readonly selectedTypeLabel = computed(() => {
    const type = this.form?.get('type')?.value as MovementType;
    return MOVEMENT_TYPES.find(t => t.value === type)?.label ?? '';
  });

  readonly isDestructiveType = computed(() => {
    const type = this.form?.get('type')?.value as MovementType;
    return type === 'EXIT' || type === 'ADJUSTMENT_OUT';
  });

  readonly form: FormGroup = this.fb.group({
    type:                   ['', [Validators.required]],
    productId:              ['', [Validators.required]],
    quantity:               [null, [Validators.required, Validators.min(1)]],
    sourceWarehouseId:      [''],
    sourceLocationId:       [''],
    destinationWarehouseId: [''],
    destinationLocationId:  [''],
    reference:              [''],
    notes:                  [''],
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadWarehouses();
  }

  fieldError(field: string): string | null {
    return this._fieldErrors().find(e => e.field === field)?.message ?? null;
  }

  private loadProducts(): void {
    this.productService.getAll({ page: 1, pageSize: 500 }).subscribe({
      next: ({ data }) => this.products.set(data),
    });
  }

  private loadWarehouses(): void {
    this.warehouseService.getAll({ page: 1, pageSize: 100, isActive: true }).subscribe({
      next: ({ data }) => this.warehouses.set(data),
    });
  }

  onTypeChange(): void {
    // Limpiar campos de origen/destino al cambiar tipo
    this.form.patchValue({
      sourceWarehouseId: '', sourceLocationId: '',
      destinationWarehouseId: '', destinationLocationId: '',
    });
    this.sourceLocations.set([]);
    this.destLocations.set([]);
  }

  onSourceWarehouseChange(): void {
    const warehouseId = this.form.get('sourceWarehouseId')?.value;
    if (!warehouseId) { this.sourceLocations.set([]); return; }
    this.locationService.getAllByWarehouse(warehouseId, { page: 1, pageSize: 200 }).subscribe({
      next: ({ data }) => this.sourceLocations.set(data),
    });
  }

  onDestWarehouseChange(): void {
    const warehouseId = this.form.get('destinationWarehouseId')?.value;
    if (!warehouseId) { this.destLocations.set([]); return; }
    this.locationService.getAllByWarehouse(warehouseId, { page: 1, pageSize: 200 }).subscribe({
      next: ({ data }) => this.destLocations.set(data),
    });
  }

  validate(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.step.set('validating');
    this.serverError.set(null);
    this._fieldErrors.set([]);

    const dto = this.buildDto();
    this.movementService.validate(dto).subscribe({
      next: (result) => {
        if (!result.valid) {
          // Errores de validación del backend → mostrar en campos
          this._fieldErrors.set(result.errors.map(e => ({ field: e.field, message: e.message })));
          this.step.set('form');
        } else {
          this.validationResult.set(result);
          this.step.set('preview');
        }
      },
      error: (err: AppError) => {
        this.serverError.set(err);
        if (err.fieldErrors?.length) this._fieldErrors.set(err.fieldErrors);
        this.step.set('form');
      },
    });
  }

  confirmAndSubmit(): void {
    if (this.isDestructiveType()) {
      this.dialog.open(ConfirmDialogComponent, {
        data: {
          title: 'Confirmar movimiento destructivo',
          message: `Este movimiento (${this.selectedTypeLabel()}) reducirá el stock. ¿Confirmar?`,
          confirmLabel: 'Confirmar',
          danger: true,
        },
      }).afterClosed().subscribe(confirmed => {
        if (confirmed) this.submit();
      });
    } else {
      this.submit();
    }
  }

  private submit(): void {
    this.step.set('submitting');
    const dto = this.buildDto();
    this.movementService.create(dto).subscribe({
      next: () => this.step.set('done'),
      error: (err: AppError) => {
        this.serverError.set(err);
        this.step.set('form');
      },
    });
  }

  resetForm(): void {
    this.form.reset({ type: '', productId: '', quantity: null, reference: '', notes: '' });
    this.validationResult.set(null);
    this.serverError.set(null);
    this._fieldErrors.set([]);
    this.step.set('form');
  }

  private buildDto() {
    const v = this.form.getRawValue();
    return {
      type: v.type,
      productId: v.productId,
      quantity: Number(v.quantity),
      ...(v.sourceWarehouseId && { sourceWarehouseId: v.sourceWarehouseId }),
      ...(v.sourceLocationId && { sourceLocationId: v.sourceLocationId }),
      ...(v.destinationWarehouseId && { destinationWarehouseId: v.destinationWarehouseId }),
      ...(v.destinationLocationId && { destinationLocationId: v.destinationLocationId }),
      ...(v.reference && { reference: v.reference }),
      ...(v.notes && { notes: v.notes }),
    };
  }
}
