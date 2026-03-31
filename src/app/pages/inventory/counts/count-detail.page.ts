import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { CountService } from '../../../shared/api/http/count.service';
import { ConfirmDialogComponent } from '../../../widgets/confirm-dialog/confirm-dialog.component';
import { CountReconciliationTableComponent } from '../../../widgets/count-reconciliation-table/count-reconciliation-table.component';
import type { PhysicalCountDetail } from '../../../entities/count/count.types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-count-detail-page',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    CountReconciliationTableComponent,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button routerLink="/inventory/counts">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="page-title">
        @if (count()) {
          Conteo {{ count()!.code }}
        } @else {
          Detalle de conteo
        }
      </h1>
    </div>

    <!-- Loading -->
    @if (loading() && !count()) {
      <div class="state-center">
        <mat-spinner diameter="48" />
      </div>
    }

    <!-- Error -->
    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error() }}</p>
        <button mat-button (click)="loadDetail()">Reintentar</button>
      </div>
    }

    @if (count()) {
      <!-- Header Info -->
      <div class="info-grid">
        <div class="info-field">
          <span class="label">Almacén</span>
          <span>{{ count()!.warehouseName }}</span>
        </div>
        <div class="info-field">
          <span class="label">Estado</span>
          <span [class]="'status-chip status-chip--' + count()!.status">
            {{ count()!.statusLabel }}
          </span>
        </div>
        <div class="info-field">
          <span class="label">Creado por</span>
          <span>{{ count()!.createdBy }}</span>
        </div>
        <div class="info-field">
          <span class="label">Fecha creación</span>
          <span>{{ count()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
        </div>
      </div>

      <!-- Progreso -->
      <div class="progress-section">
        <div class="progress-stats">
          <span><strong>{{ count()!.countedItems }}</strong> / {{ count()!.totalItems }} contados</span>
          <span class="discrepancy-count">
            <mat-icon class="small-icon">warning</mat-icon>
            {{ count()!.discrepancyItems }} con diferencias
          </span>
        </div>
        <mat-progress-bar
          mode="determinate"
          [value]="count()!.progressPercent"
          class="progress-bar"
        />
        <span class="progress-pct">{{ count()!.progressPercent }}%</span>
      </div>

      <!-- Acciones -->
      <div class="actions-bar">
        @if (canConfirm()) {
          <button
            mat-flat-button
            color="primary"
            [routerLink]="['/inventory/counts', count()!.id, 'confirm']"
          >
            <mat-icon>check_circle</mat-icon> Confirmar conteo
          </button>
        }
        @if (canCancel()) {
          <button mat-stroked-button color="warn" (click)="cancelCount()">
            <mat-icon>cancel</mat-icon> Cancelar conteo
          </button>
        }
      </div>

      <!-- Tabla de ítems -->
      <app-count-reconciliation-table
        [items]="count()!.items"
        [loading]="saving()"
        [editable]="count()!.status !== 'completed' && count()!.status !== 'cancelled'"
        (itemUpdated)="onItemUpdated($event)"
      />
    }
  `,
  styles: [`
    .page-header  { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .page-title   { margin: 0; font-size: 24px; font-weight: 500; }
    .state-center, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .info-field { display: flex; flex-direction: column; gap: 4px; }
    .info-field .label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: .05em; }
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; width: fit-content; }
    .status-chip--draft       { background: #e3f2fd; color: #1565c0; }
    .status-chip--in_progress { background: #fff8e1; color: #f57f17; }
    .status-chip--completed   { background: #e8f5e9; color: #2e7d32; }
    .status-chip--cancelled   { background: #fce4ec; color: #c62828; }
    .progress-section { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .progress-stats { display: flex; gap: 16px; align-items: center; font-size: 14px; white-space: nowrap; }
    .discrepancy-count { display: flex; align-items: center; gap: 4px; color: #f57f17; }
    .small-icon { font-size: 16px; width: 16px; height: 16px; }
    .progress-bar { flex: 1; }
    .progress-pct { font-size: 14px; font-weight: 500; white-space: nowrap; }
    .actions-bar { display: flex; gap: 12px; margin-bottom: 24px; }
  `],
})
export class CountDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly countService = inject(CountService);
  private readonly dialog = inject(MatDialog);

  readonly count = signal<PhysicalCountDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly saving = signal(false);

  readonly canConfirm = computed(() => {
    const c = this.count();
    if (!c) return false;
    return c.status === 'in_progress' && c.countedItems > 0;
  });

  readonly canCancel = computed(() => {
    const c = this.count();
    if (!c) return false;
    return c.status === 'draft' || c.status === 'in_progress';
  });

  private countId = '';

  ngOnInit(): void {
    this.countId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadDetail();
  }

  loadDetail(): void {
    if (!this.countId) return;
    this.loading.set(true);
    this.error.set(null);
    this.countService.getById(this.countId).subscribe({
      next: (detail) => {
        this.count.set(detail);
        this.loading.set(false);
      },
      error: (err: AppError) => {
        this.error.set(err.title ?? 'Error al cargar el conteo');
        this.loading.set(false);
      },
    });
  }

  onItemUpdated(event: { itemId: string; countedQty: number }): void {
    this.saving.set(true);
    this.countService.updateItem(this.countId, event.itemId, event.countedQty).subscribe({
      next: () => this.loadDetail(),
      error: (err: AppError) => {
        this.error.set(err.title ?? 'Error al actualizar ítem');
        this.saving.set(false);
      },
    });
  }

  cancelCount(): void {
    const c = this.count();
    if (!c) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Cancelar conteo',
        message: `¿Estás seguro de cancelar el conteo ${c.code}? Esta acción no se puede deshacer.`,
        confirmLabel: 'Cancelar conteo',
        danger: true,
      },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.countService.cancel(this.countId).subscribe({
          next: () => this.router.navigate(['/inventory/counts']),
          error: (err: AppError) => this.error.set(err.title ?? 'Error al cancelar'),
        });
      }
    });
  }
}
