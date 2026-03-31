import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { StockService } from '../../shared/api/http/stock.service';
import { ExportService } from '../../shared/services/export.service';
import { FileUtils } from '../../shared/utils/file.utils';
import type { StockEntry } from '../../entities/stock/stock.types';
import type { PaginationMeta } from '../../shared/types';

@Component({
  selector: 'app-report-stock-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Reporte de Stock</h1>
      <button
        mat-flat-button
        color="accent"
        (click)="onExportCsv()"
        [disabled]="isExporting()"
      >
        <mat-icon>download</mat-icon>
        {{ isExporting() ? 'Exportando...' : 'Exportar CSV' }}
      </button>
    </div>

    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-search">
        <mat-label>Buscar</mat-label>
        <input matInput [formControl]="searchControl" placeholder="Código o nombre..." />
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-status">
        <mat-label>Estado</mat-label>
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
      <div class="state-center">
        <mat-spinner diameter="48" />
      </div>
    }

    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-button (click)="loadData()">Reintentar</button>
      </div>
    }

    @if (!loading() && !error()) {
      @if (data().length === 0) {
        <div class="state-empty">
          <mat-icon>inventory_2</mat-icon>
          <p>No hay datos de stock para mostrar.</p>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="data()">
            <ng-container matColumnDef="productSku">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let row">{{ row.productSku }}</td>
            </ng-container>

            <ng-container matColumnDef="productName">
              <th mat-header-cell *matHeaderCellDef>Producto</th>
              <td mat-cell *matCellDef="let row">{{ row.productName }}</td>
            </ng-container>

            <ng-container matColumnDef="warehouseName">
              <th mat-header-cell *matHeaderCellDef>Almacén</th>
              <td mat-cell *matCellDef="let row">{{ row.warehouseName }}</td>
            </ng-container>

            <ng-container matColumnDef="totalQuantity">
              <th mat-header-cell *matHeaderCellDef>Stock actual</th>
              <td mat-cell *matCellDef="let row">{{ row.totalQuantity }}</td>
            </ng-container>

            <ng-container matColumnDef="availableQuantity">
              <th mat-header-cell *matHeaderCellDef>Disponible</th>
              <td mat-cell *matCellDef="let row">{{ row.availableQuantity }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let row">
                <span [class]="'status-chip status-chip--' + row.status">
                  {{ row.statusLabel }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          @if (meta()) {
            <mat-paginator
              [length]="meta()!.total"
              [pageSize]="meta()!.pageSize"
              [pageIndex]="meta()!.page - 1"
              [pageSizeOptions]="[10, 25, 50]"
              (page)="onPageChange($event)"
              showFirstLastButtons
            />
          }
        </div>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title  { margin: 0; font-size: 24px; font-weight: 500; }
    .filters-bar { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-search { width: 300px; }
    .filter-status { width: 200px; }
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-chip--ok       { background: #e8f5e9; color: #2e7d32; }
    .status-chip--low      { background: #fff8e1; color: #f57f17; }
    .status-chip--critical { background: #fff3e0; color: #e65100; }
    .status-chip--out      { background: #fce4ec; color: #c62828; }
  `],
})
export class ReportStockPage implements OnInit {
  private readonly stockService = inject(StockService);
  private readonly exportService = inject(ExportService);

  readonly displayedColumns = [
    'productSku', 'productName', 'warehouseName', 'totalQuantity', 'availableQuantity', 'status',
  ];

  readonly data = signal<StockEntry[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly search = signal('');
  readonly status = signal('');

  readonly isExporting = computed(() => this.exportService.isExporting());

  readonly searchControl = new FormControl('');
  readonly statusControl = new FormControl('');

  ngOnInit(): void {
    this.loadData();
    this.searchControl.valueChanges.subscribe(v => {
      this.search.set(v ?? '');
      this.resetPage();
      this.loadData();
    });
    this.statusControl.valueChanges.subscribe(v => {
      this.status.set(v ?? '');
      this.resetPage();
      this.loadData();
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    const page = this.meta()?.page ?? 1;
    const pageSize = this.meta()?.pageSize ?? 10;

    this.stockService.getCurrent({
      page,
      pageSize,
      ...(this.search() && { search: this.search() }),
      ...(this.status() && { status: this.status() }),
    }).subscribe({
      next: ({ data, meta }) => {
        this.data.set(data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el reporte de stock');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => m ? { ...m, page: event.pageIndex + 1, pageSize: event.pageSize } : m);
    this.loadData();
  }

  onExportCsv(): void {
    const params: Record<string, string> = {};
    if (this.search()) params['search'] = this.search();
    if (this.status()) params['status'] = this.status();

    const filename = FileUtils.buildFilename('stock-report', 'csv');
    this.exportService.exportCsv('/inventory/reports/stock', params, filename).subscribe();
  }

  private resetPage(): void {
    this.meta.update(m => m ? { ...m, page: 1 } : null);
  }
}
