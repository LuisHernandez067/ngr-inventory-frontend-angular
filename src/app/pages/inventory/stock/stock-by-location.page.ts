import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { StockService } from '../../../shared/api/http/stock.service';
import { WarehouseService } from '../../../shared/api/http/warehouse.service';
import type { StockEntry } from '../../../entities/stock/stock.types';
import type { Warehouse } from '../../../entities/warehouse/warehouse.types';
import type { PaginationMeta, AppError } from '../../../shared/types';

@Component({
  selector: 'app-stock-by-location-page',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="..">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="page-title">Stock por ubicación</h1>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-warehouse">
        <mat-label>Almacén</mat-label>
        <mat-select [formControl]="warehouseControl">
          <mat-option value="">Seleccionar almacén...</mat-option>
          @for (w of warehouses(); track w.id) {
            <mat-option [value]="w.id">{{ w.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Buscar producto</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="searchControl" placeholder="Nombre o SKU..." />
      </mat-form-field>
    </div>

    @if (!warehouseControl.value) {
      <div class="state-empty">
        <mat-icon>warehouse</mat-icon>
        <p>Seleccioná un almacén para ver el stock por ubicación.</p>
      </div>
    } @else if (loading()) {
      <div class="state-center"><mat-spinner diameter="48" /></div>
    } @else if (error()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error()!.title }}</p>
        <button mat-button (click)="load()">Reintentar</button>
      </div>
    } @else if (entries().length === 0) {
      <div class="state-empty">
        <mat-icon>inventory</mat-icon>
        <p>No hay stock en este almacén.</p>
      </div>
    } @else {
      <div class="table-container mat-elevation-z1">
        <table mat-table [dataSource]="entries()">
          <ng-container matColumnDef="location">
            <th mat-header-cell *matHeaderCellDef>Ubicación</th>
            <td mat-cell *matCellDef="let e">{{ e.locationName || 'Sin ubicación' }}</td>
          </ng-container>
          <ng-container matColumnDef="product">
            <th mat-header-cell *matHeaderCellDef>Producto</th>
            <td mat-cell *matCellDef="let e">
              <span class="product-name">{{ e.productName }}</span>
              <span class="product-sku">{{ e.productSku }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let e">{{ e.totalQuantity }} {{ e.unit }}</td>
          </ng-container>
          <ng-container matColumnDef="available">
            <th mat-header-cell *matHeaderCellDef>Disponible</th>
            <td mat-cell *matCellDef="let e">
              <span [class]="'stock-val stock-val--' + e.statusColor">{{ e.availableQuantity }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let e">
              <span [class]="'status-chip status-chip--' + e.statusColor">{{ e.statusLabel }}</span>
            </td>
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
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .page-title  { margin: 0; font-size: 24px; font-weight: 500; }
    .filters-bar { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-warehouse { width: 240px; }
    .filter-search { flex: 1; min-width: 200px; }
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center; color: #666;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
    .product-name { display: block; font-weight: 500; }
    .product-sku  { display: block; font-size: 12px; color: #666; }
    .stock-val { font-weight: 600; }
    .stock-val--ok    { color: #2e7d32; }
    .stock-val--warn  { color: #f57f17; }
    .stock-val--error { color: #c62828; }
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-chip--ok    { background: #e8f5e9; color: #2e7d32; }
    .status-chip--warn  { background: #fff8e1; color: #f57f17; }
    .status-chip--error { background: #fce4ec; color: #c62828; }
  `],
})
export class StockByLocationPage implements OnInit {
  private readonly stockService    = inject(StockService);
  private readonly warehouseService = inject(WarehouseService);

  readonly displayedColumns = ['location', 'product', 'total', 'available', 'status'];
  readonly entries   = signal<StockEntry[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly meta      = signal<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  readonly loading   = signal(false);
  readonly error     = signal<AppError | null>(null);

  readonly searchControl   = new FormControl('');
  readonly warehouseControl = new FormControl('');

  ngOnInit(): void {
    this.warehouseService.getAll({ page: 1, pageSize: 100, isActive: true })
      .subscribe({ next: ({ data }) => this.warehouses.set(data) });

    this.warehouseControl.valueChanges.subscribe(() => {
      this.meta.update(m => ({ ...m, page: 1 }));
      if (this.warehouseControl.value) this.load();
    });
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.meta.update(m => ({ ...m, page: 1 }));
      if (this.warehouseControl.value) this.load();
    });
  }

  load(): void {
    const warehouseId = this.warehouseControl.value;
    if (!warehouseId) return;
    this.loading.set(true);
    this.error.set(null);
    this.stockService.getByLocation(warehouseId, {
      page: this.meta().page,
      pageSize: this.meta().pageSize,
      search: this.searchControl.value ?? undefined,
    }).subscribe({
      next: ({ data, meta }) => { this.entries.set(data); this.meta.set(meta); this.loading.set(false); },
      error: (err: AppError) => { this.error.set(err); this.loading.set(false); },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => ({ ...m, page: event.pageIndex + 1, pageSize: event.pageSize }));
    this.load();
  }
}
