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
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { StockService } from '../../../shared/api/http/stock.service';
import { CategoryService } from '../../../shared/api/http/category.service';
import { WarehouseService } from '../../../shared/api/http/warehouse.service';
import type { StockEntry, StockStatus } from '../../../entities/stock/stock.types';
import type { Category } from '../../../entities/category/category.types';
import type { Warehouse } from '../../../entities/warehouse/warehouse.types';
import type { PaginationMeta, AppError } from '../../../shared/types';

@Component({
  selector: 'app-stock-current-page',
  standalone: true,
  imports: [
    RouterLink, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatButtonModule,
    MatIconModule, MatInputModule, MatFormFieldModule,
    MatSelectModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Stock actual</h1>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Buscar</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input matInput [formControl]="searchControl" placeholder="Nombre o SKU..." />
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-select">
        <mat-label>Categoría</mat-label>
        <mat-select [formControl]="categoryControl">
          <mat-option value="">Todas</mat-option>
          @for (c of categories(); track c.id) {
            <mat-option [value]="c.id">{{ c.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-select">
        <mat-label>Almacén</mat-label>
        <mat-select [formControl]="warehouseControl">
          <mat-option value="">Todos</mat-option>
          @for (w of warehouses(); track w.id) {
            <mat-option [value]="w.id">{{ w.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-select">
        <mat-label>Estado stock</mat-label>
        <mat-select [formControl]="statusControl">
          <mat-option value="">Todos</mat-option>
          <mat-option value="ok">OK</mat-option>
          <mat-option value="low">Stock bajo</mat-option>
          <mat-option value="critical">Stock crítico</mat-option>
          <mat-option value="out">Sin stock</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    @if (loading()) {
      <div class="state-center"><mat-spinner diameter="48" /></div>
    }

    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error()!.title }}</p>
        <button mat-button (click)="load()">Reintentar</button>
      </div>
    }

    @if (!loading() && !error()) {
      @if (entries().length === 0) {
        <div class="state-empty">
          <mat-icon>inventory</mat-icon>
          <p>No hay stock para mostrar con los filtros aplicados.</p>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="entries()">
            <ng-container matColumnDef="product">
              <th mat-header-cell *matHeaderCellDef>Producto</th>
              <td mat-cell *matCellDef="let e">
                <span class="product-name">{{ e.productName }}</span>
                <span class="product-sku">{{ e.productSku }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Categoría</th>
              <td mat-cell *matCellDef="let e">{{ e.categoryName }}</td>
            </ng-container>
            <ng-container matColumnDef="total">
              <th mat-header-cell *matHeaderCellDef>Total</th>
              <td mat-cell *matCellDef="let e">{{ e.totalQuantity }} {{ e.unit }}</td>
            </ng-container>
            <ng-container matColumnDef="reserved">
              <th mat-header-cell *matHeaderCellDef>Reservado</th>
              <td mat-cell *matCellDef="let e">{{ e.reservedQuantity }}</td>
            </ng-container>
            <ng-container matColumnDef="available">
              <th mat-header-cell *matHeaderCellDef>Disponible</th>
              <td mat-cell *matCellDef="let e">
                <span [class]="'stock-val stock-val--' + e.statusColor">
                  {{ e.availableQuantity }}
                </span>
              </td>
            </ng-container>
            <ng-container matColumnDef="minStock">
              <th mat-header-cell *matHeaderCellDef>Stock mín.</th>
              <td mat-cell *matCellDef="let e">{{ e.minStock || '—' }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let e">
                <span [class]="'status-chip status-chip--' + e.statusColor">
                  {{ e.statusLabel }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                [class.row-alert]="row.status === 'out' || row.status === 'critical'"></tr>
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
    .filter-select { width: 180px; }
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
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
    .row-alert { background: #fff8f8; }
  `],
})
export class StockCurrentPage implements OnInit {
  private readonly stockService    = inject(StockService);
  private readonly categoryService = inject(CategoryService);
  private readonly warehouseService = inject(WarehouseService);

  readonly displayedColumns = ['product', 'category', 'total', 'reserved', 'available', 'minStock', 'status'];
  readonly entries   = signal<StockEntry[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly meta      = signal<PaginationMeta>({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  readonly loading   = signal(false);
  readonly error     = signal<AppError | null>(null);

  readonly searchControl   = new FormControl('');
  readonly categoryControl = new FormControl('');
  readonly warehouseControl = new FormControl('');
  readonly statusControl   = new FormControl<StockStatus | ''>('');

  ngOnInit(): void {
    this.loadFilters();
    this.load();
    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged())
      .subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.load(); });
    this.categoryControl.valueChanges.subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.load(); });
    this.warehouseControl.valueChanges.subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.load(); });
    this.statusControl.valueChanges.subscribe(() => { this.meta.update(m => ({ ...m, page: 1 })); this.load(); });
  }

  private loadFilters(): void {
    this.categoryService.getAll({ page: 1, pageSize: 200 }).subscribe({ next: ({ data }) => this.categories.set(data) });
    this.warehouseService.getAll({ page: 1, pageSize: 100, isActive: true }).subscribe({ next: ({ data }) => this.warehouses.set(data) });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.stockService.getCurrent({
      page: this.meta().page,
      pageSize: this.meta().pageSize,
      search:      this.searchControl.value    ?? undefined,
      categoryId:  this.categoryControl.value  || undefined,
      warehouseId: this.warehouseControl.value || undefined,
      status:      this.statusControl.value    || undefined,
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
