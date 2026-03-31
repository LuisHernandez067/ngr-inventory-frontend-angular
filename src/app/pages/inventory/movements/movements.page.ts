import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MovementService } from '../../../shared/api/http/movement.service';
import type { Movement, MovementType, MovementStatus } from '../../../entities/movement/movement.types';
import type { PaginationMeta } from '../../../shared/types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-movements-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule, DatePipe,
    MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatProgressSpinnerModule, MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Movimientos de inventario</h1>
      <button mat-flat-button color="primary" routerLink="new">
        <mat-icon>add</mat-icon> Registrar movimiento
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Buscar</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="searchControl" placeholder="Producto, referencia..." />
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-type">
        <mat-label>Tipo</mat-label>
        <mat-select [formControl]="typeControl">
          <mat-option value="">Todos</mat-option>
          <mat-option value="ENTRY">Entrada</mat-option>
          <mat-option value="EXIT">Salida</mat-option>
          <mat-option value="TRANSFER">Transferencia</mat-option>
          <mat-option value="ADJUSTMENT_IN">Ajuste entrada</mat-option>
          <mat-option value="ADJUSTMENT_OUT">Ajuste salida</mat-option>
          <mat-option value="RETURN">Devolución</mat-option>
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-status">
        <mat-label>Estado</mat-label>
        <mat-select [formControl]="statusControl">
          <mat-option value="">Todos</mat-option>
          <mat-option value="PENDING">Pendiente</mat-option>
          <mat-option value="CONFIRMED">Confirmado</mat-option>
          <mat-option value="CANCELLED">Cancelado</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <!-- Estado: loading -->
    @if (loading()) {
      <div class="state-center">
        <mat-spinner diameter="48" />
      </div>
    }

    <!-- Estado: error -->
    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error()!.title }}</p>
        <button mat-button (click)="loadMovements()">Reintentar</button>
      </div>
    }

    <!-- Tabla -->
    @if (!loading() && !error()) {
      @if (movements().length === 0) {
        <div class="state-empty">
          <mat-icon>swap_horiz</mat-icon>
          <p>No hay movimientos para mostrar.</p>
          <button mat-flat-button color="primary" routerLink="new">Registrar primer movimiento</button>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="movements()">
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let m">
                <span class="type-badge">
                  <mat-icon class="type-icon">{{ m.directionIcon }}</mat-icon>
                  {{ m.typeLabel }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>Producto</th>
              <td mat-cell *matCellDef="let m">
                <span class="product-name">{{ m.productName }}</span>
                <span class="product-sku">{{ m.productSku }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Cantidad</th>
              <td mat-cell *matCellDef="let m">{{ m.quantity }} {{ m.unit }}</td>
            </ng-container>
            <ng-container matColumnDef="warehouse">
              <th mat-header-cell *matHeaderCellDef>Almacén</th>
              <td mat-cell *matCellDef="let m">
                @if (m.sourceWarehouseName && m.destinationWarehouseName) {
                  {{ m.sourceWarehouseName }} → {{ m.destinationWarehouseName }}
                } @else {
                  {{ m.sourceWarehouseName || m.destinationWarehouseName || '—' }}
                }
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let m">
                <span [class]="'status-chip status-chip--' + m.status.toLowerCase()">
                  {{ m.statusLabel }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="performedBy">
              <th mat-header-cell *matHeaderCellDef>Usuario</th>
              <td mat-cell *matCellDef="let m">{{ m.performedByName }}</td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let m">{{ m.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="meta().total"
            [pageSize]="meta().pageSize"
            [pageIndex]="meta().page - 1"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          />
        </div>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title  { margin: 0; font-size: 24px; font-weight: 500; }
    .filters-bar { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-search { flex: 1; min-width: 200px; }
    .filter-type, .filter-status { width: 180px; }
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
    .type-badge { display: flex; align-items: center; gap: 4px; }
    .type-icon  { font-size: 18px; width: 18px; height: 18px; }
    .product-name { display: block; font-weight: 500; }
    .product-sku  { display: block; font-size: 12px; color: #666; }
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-chip--confirmed { background: #e8f5e9; color: #2e7d32; }
    .status-chip--pending   { background: #fff8e1; color: #f57f17; }
    .status-chip--cancelled { background: #fce4ec; color: #c62828; }
  `],
})
export class MovementsPage implements OnInit {
  private readonly movementService = inject(MovementService);

  readonly displayedColumns = ['type', 'product', 'quantity', 'warehouse', 'status', 'performedBy', 'createdAt'];
  readonly movements = signal<Movement[]>([]);
  readonly meta = signal<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);

  readonly searchControl = new FormControl('');
  readonly typeControl = new FormControl<MovementType | ''>('');
  readonly statusControl = new FormControl<MovementStatus | ''>('');

  ngOnInit(): void {
    this.loadMovements();
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadMovements(); });
    this.typeControl.valueChanges
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadMovements(); });
    this.statusControl.valueChanges
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.loadMovements(); });
  }

  loadMovements(): void {
    this.loading.set(true);
    this.error.set(null);
    this.movementService.getAll({
      page: this.meta().page,
      pageSize: this.meta().pageSize,
      search: this.searchControl.value ?? undefined,
      type: this.typeControl.value || undefined,
      status: this.statusControl.value || undefined,
    }).subscribe({
      next: ({ data, meta }) => { this.movements.set(data); this.meta.set(meta); this.loading.set(false); },
      error: (err: AppError) => { this.error.set(err); this.loading.set(false); },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => ({ ...m, page: event.pageIndex + 1, pageSize: event.pageSize }));
    this.loadMovements();
  }
}
