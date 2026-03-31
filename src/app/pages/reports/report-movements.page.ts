import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MovementService } from '../../shared/api/http/movement.service';
import { ExportService } from '../../shared/services/export.service';
import { FileUtils } from '../../shared/utils/file.utils';
import type { Movement } from '../../entities/movement/movement.types';
import type { PaginationMeta } from '../../shared/types';

@Component({
  selector: 'app-report-movements-page',
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
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Reporte de Movimientos</h1>
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
      <mat-form-field appearance="outline">
        <mat-label>Desde</mat-label>
        <input matInput type="date" [formControl]="dateFromControl" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Hasta</mat-label>
        <input matInput type="date" [formControl]="dateToControl" />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Tipo</mat-label>
        <mat-select [formControl]="movementTypeControl">
          <mat-option value="">Todos</mat-option>
          <mat-option value="ENTRY">Entrada</mat-option>
          <mat-option value="EXIT">Salida</mat-option>
          <mat-option value="TRANSFER">Transferencia</mat-option>
          <mat-option value="ADJUSTMENT_IN">Ajuste entrada</mat-option>
          <mat-option value="ADJUSTMENT_OUT">Ajuste salida</mat-option>
          <mat-option value="RETURN">Devolución</mat-option>
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
          <mat-icon>swap_horiz</mat-icon>
          <p>No hay movimientos para mostrar.</p>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="data()">
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let row">{{ row.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>

            <ng-container matColumnDef="typeLabel">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let row">{{ row.typeLabel }}</td>
            </ng-container>

            <ng-container matColumnDef="productSku">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let row">{{ row.productSku }}</td>
            </ng-container>

            <ng-container matColumnDef="productName">
              <th mat-header-cell *matHeaderCellDef>Producto</th>
              <td mat-cell *matCellDef="let row">{{ row.productName }}</td>
            </ng-container>

            <ng-container matColumnDef="quantity">
              <th mat-header-cell *matHeaderCellDef>Cantidad</th>
              <td mat-cell *matCellDef="let row">{{ row.quantity }}</td>
            </ng-container>

            <ng-container matColumnDef="sourceWarehouseName">
              <th mat-header-cell *matHeaderCellDef>Almacén</th>
              <td mat-cell *matCellDef="let row">
                {{ row.sourceWarehouseName || row.destinationWarehouseName || '—' }}
              </td>
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
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
  `],
})
export class ReportMovementsPage implements OnInit {
  private readonly movementService = inject(MovementService);
  private readonly exportService = inject(ExportService);

  readonly displayedColumns = [
    'createdAt', 'typeLabel', 'productSku', 'productName', 'quantity', 'sourceWarehouseName', 'performedByName',
  ];

  readonly data = signal<Movement[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly dateFrom = signal('');
  readonly dateTo = signal('');
  readonly movementType = signal('');

  readonly isExporting = computed(() => this.exportService.isExporting());

  readonly dateFromControl = new FormControl('');
  readonly dateToControl = new FormControl('');
  readonly movementTypeControl = new FormControl('');

  ngOnInit(): void {
    this.loadData();
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
    this.movementTypeControl.valueChanges.subscribe(v => {
      this.movementType.set(v ?? '');
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
      ...(this.dateFrom() && { dateFrom: this.dateFrom() }),
      ...(this.dateTo() && { dateTo: this.dateTo() }),
      ...(this.movementType() && { type: this.movementType() as any }),
    }).subscribe({
      next: ({ data, meta }) => {
        this.data.set(data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar el reporte de movimientos');
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
    if (this.dateFrom()) params['dateFrom'] = this.dateFrom();
    if (this.dateTo()) params['dateTo'] = this.dateTo();
    if (this.movementType()) params['type'] = this.movementType();

    const filename = FileUtils.buildFilename('movements-report', 'csv');
    this.exportService.exportCsv('/inventory/reports/movements', params, filename).subscribe();
  }

  private resetPage(): void {
    this.meta.update(m => m ? { ...m, page: 1 } : null);
  }
}
