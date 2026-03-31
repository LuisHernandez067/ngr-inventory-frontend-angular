import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MovementService } from '../../shared/api/http/movement.service';
import { ExportService } from '../../shared/services/export.service';
import { FileUtils } from '../../shared/utils/file.utils';
import type { Movement } from '../../entities/movement/movement.types';
import type { PaginationMeta } from '../../shared/types';

@Component({
  selector: 'app-report-kardex-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Reporte Kardex</h1>
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
      <mat-form-field appearance="outline" class="filter-product">
        <mat-label>ID de Producto</mat-label>
        <input matInput [formControl]="productIdControl" placeholder="ID del producto..." />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Desde</mat-label>
        <input matInput type="date" [formControl]="dateFromControl" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Hasta</mat-label>
        <input matInput type="date" [formControl]="dateToControl" />
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
          <mat-icon>history</mat-icon>
          <p>No hay registros kardex para mostrar.</p>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="data()">
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>

            <ng-container matColumnDef="typeLabel">
              <th mat-header-cell *matHeaderCellDef>Tipo movimiento</th>
              <td mat-cell *matCellDef="let row">{{ row.typeLabel }}</td>
            </ng-container>

            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Cantidad</th>
              <td mat-cell *matCellDef="let row">{{ row.quantity }}</td>
            </ng-container>

            <ng-container matColumnDef="reference">
              <th mat-header-cell *matHeaderCellDef>Referencia</th>
              <td mat-cell *matCellDef="let row">{{ row.reference || '—' }}</td>
            </ng-container>

            <ng-container matColumnDef="performedByName">
              <th mat-header-cell *matHeaderCellDef>Realizado por</th>
              <td mat-cell *matCellDef="let row">{{ row.performedByName }}</td>
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
    .filter-product { width: 300px; }
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
  `],
})
export class ReportKardexPage implements OnInit {
  private readonly movementService = inject(MovementService);
  private readonly exportService = inject(ExportService);

  readonly displayedColumns = [
    'createdAt', 'typeLabel', 'quantity', 'reference', 'performedByName',
  ];

  readonly data = signal<Movement[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly productId = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly isExporting = computed(() => this.exportService.isExporting());

  readonly productIdControl = new FormControl('');
  readonly dateFromControl = new FormControl('');
  readonly dateToControl = new FormControl('');

  ngOnInit(): void {
    this.loadData();
    this.productIdControl.valueChanges.subscribe(v => {
      this.productId.set(v ?? '');
      this.resetPage();
      this.loadData();
    });
    this.dateFromControl.valueChanges.subscribe(v => {
      this.dateFrom.set(v ?? '');
      this.resetPage();
      this.loadData();
    });
    this.dateToControl.valueChanges.subscribe(v => {
      this.dateTo.set(v ?? '');
      this.resetPage();
      this.loadData();
    });
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);
    const page = this.meta()?.page ?? 1;
    const pageSize = this.meta()?.pageSize ?? 10;

    this.movementService.getAll({
      page,
      pageSize,
      ...(this.productId() && { productId: this.productId() }),
      ...(this.dateFrom() && { dateFrom: this.dateFrom() }),
      ...(this.dateTo() && { dateTo: this.dateTo() }),
    }).subscribe({
      next: ({ data, meta }) => {
        this.data.set(data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el reporte kardex');
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
    if (this.productId()) params['productId'] = this.productId();
    if (this.dateFrom()) params['dateFrom'] = this.dateFrom();
    if (this.dateTo()) params['dateTo'] = this.dateTo();

    const filename = FileUtils.buildFilename('kardex-report', 'csv');
    this.exportService.exportCsv('/inventory/reports/kardex', params, filename).subscribe();
  }

  private resetPage(): void {
    this.meta.update(m => m ? { ...m, page: 1 } : null);
  }
}
