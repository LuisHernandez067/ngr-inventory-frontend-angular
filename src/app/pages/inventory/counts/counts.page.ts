import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CountService } from '../../../shared/api/http/count.service';
import { ConfirmDialogComponent } from '../../../widgets/confirm-dialog/confirm-dialog.component';
import type { PhysicalCount } from '../../../entities/count/count.types';
import type { PaginationMeta } from '../../../shared/types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-counts-page',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Conteos físicos</h1>
      <button mat-flat-button color="primary" routerLink="new">
        <mat-icon>add</mat-icon> Nuevo conteo
      </button>
    </div>

    <!-- Filtros -->
    <div class="filters-bar">
      <mat-form-field appearance="outline" class="filter-status">
        <mat-label>Estado</mat-label>
        <mat-select [formControl]="statusControl">
          <mat-option value="">Todos</mat-option>
          <mat-option value="draft">Borrador</mat-option>
          <mat-option value="in_progress">En progreso</mat-option>
          <mat-option value="completed">Completado</mat-option>
          <mat-option value="cancelled">Cancelado</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <!-- Loading -->
    @if (loading()) {
      <div class="state-center">
        <mat-spinner diameter="48" />
      </div>
    }

    <!-- Error -->
    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-button (click)="loadCounts()">Reintentar</button>
      </div>
    }

    <!-- Tabla -->
    @if (!loading() && !error()) {
      @if (counts().length === 0) {
        <div class="state-empty">
          <mat-icon>inventory</mat-icon>
          <p>No hay conteos físicos para mostrar.</p>
          <button mat-flat-button color="primary" routerLink="new">Crear primer conteo</button>
        </div>
      } @else {
        <div class="table-container mat-elevation-z1">
          <table mat-table [dataSource]="counts()">
            <ng-container matColumnDef="code">
              <th mat-header-cell *matHeaderCellDef>Código</th>
              <td mat-cell *matCellDef="let c">{{ c.code }}</td>
            </ng-container>

            <ng-container matColumnDef="warehouseName">
              <th mat-header-cell *matHeaderCellDef>Almacén</th>
              <td mat-cell *matCellDef="let c">{{ c.warehouseName }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Estado</th>
              <td mat-cell *matCellDef="let c">
                <span [class]="'status-chip status-chip--' + c.status">
                  {{ c.statusLabel }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="totalItems">
              <th mat-header-cell *matHeaderCellDef>Total ítems</th>
              <td mat-cell *matCellDef="let c">{{ c.totalItems }}</td>
            </ng-container>

            <ng-container matColumnDef="countedItems">
              <th mat-header-cell *matHeaderCellDef>Contados</th>
              <td mat-cell *matCellDef="let c">{{ c.countedItems }}</td>
            </ng-container>

            <ng-container matColumnDef="progressPercent">
              <th mat-header-cell *matHeaderCellDef>Progreso</th>
              <td mat-cell *matCellDef="let c">
                <div class="progress-cell">
                  <mat-progress-bar mode="determinate" [value]="c.progressPercent" />
                  <span class="progress-label">{{ c.progressPercent }}%</span>
                </div>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Fecha creación</th>
              <td mat-cell *matCellDef="let c">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let c">
                <button mat-icon-button [routerLink]="['/inventory/counts', c.id]" title="Ver detalle">
                  <mat-icon>visibility</mat-icon>
                </button>
                @if (c.status === 'draft' || c.status === 'in_progress') {
                  <button mat-icon-button color="warn" (click)="cancelCount(c)" title="Cancelar conteo">
                    <mat-icon>cancel</mat-icon>
                  </button>
                }
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
    .filter-status { width: 200px; }
    .table-container { overflow-x: auto; border-radius: 8px; }
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-chip--draft       { background: #e3f2fd; color: #1565c0; }
    .status-chip--in_progress { background: #fff8e1; color: #f57f17; }
    .status-chip--completed   { background: #e8f5e9; color: #2e7d32; }
    .status-chip--cancelled   { background: #fce4ec; color: #c62828; }
    .progress-cell { display: flex; align-items: center; gap: 8px; min-width: 120px; }
    .progress-cell mat-progress-bar { flex: 1; }
    .progress-label { font-size: 12px; white-space: nowrap; }
  `],
})
export class CountsPage implements OnInit {
  private readonly countService = inject(CountService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  readonly displayedColumns = [
    'code', 'warehouseName', 'status', 'totalItems', 'countedItems',
    'progressPercent', 'createdAt', 'actions',
  ];
  readonly counts = signal<PhysicalCount[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly warehouseFilter = signal('');
  readonly statusFilter = signal<string>('');

  readonly statusControl = new FormControl('');

  ngOnInit(): void {
    this.loadCounts();
    this.statusControl.valueChanges.subscribe(value => {
      this.statusFilter.set(value ?? '');
      this.resetPage();
      this.loadCounts();
    });
  }

  loadCounts(): void {
    this.loading.set(true);
    this.error.set(null);
    const page = this.meta()?.page ?? 1;
    const pageSize = this.meta()?.pageSize ?? 10;

    this.countService.getAll({
      page,
      pageSize,
      ...(this.warehouseFilter() && { warehouseId: this.warehouseFilter() }),
      ...(this.statusFilter()    && { status:      this.statusFilter() }),
    }).subscribe({
      next: ({ data, meta }) => {
        this.counts.set(data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err: AppError) => {
        this.error.set(err.title ?? 'Error al cargar conteos');
        this.loading.set(false);
      },
    });
  }

  onPageChange(event: PageEvent): void {
    this.meta.update(m => m ? { ...m, page: event.pageIndex + 1, pageSize: event.pageSize } : m);
    this.loadCounts();
  }

  cancelCount(count: PhysicalCount): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar conteo',
        message: `¿Estás seguro de cancelar el conteo ${count.code}? Esta acción no se puede deshacer.`,
        confirmLabel: 'Cancelar conteo',
        danger: true,
      },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.countService.cancel(count.id).subscribe({
          next: () => this.loadCounts(),
          error: (err: AppError) => this.error.set(err.title ?? 'Error al cancelar'),
        });
      }
    });
  }

  private resetPage(): void {
    this.meta.update(m => m ? { ...m, page: 1 } : null);
  }
}
