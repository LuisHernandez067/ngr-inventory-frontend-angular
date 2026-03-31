import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { CountService } from '../../../shared/api/http/count.service';
import { ConfirmDialogComponent } from '../../../widgets/confirm-dialog/confirm-dialog.component';
import type { PhysicalCountDetail } from '../../../entities/count/count.types';
import type { AppError } from '../../../shared/types';

@Component({
  selector: 'app-count-confirm-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button [routerLink]="['/inventory/counts', countId]">
        <mat-icon>arrow_back</mat-icon>
      </button>
      <h1 class="page-title">Confirmar conteo</h1>
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
      </div>
    }

    @if (count() && !loading()) {
      <!-- Resumen -->
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-value">{{ count()!.totalItems }}</span>
          <span class="summary-label">Total ítems</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ count()!.countedItems }}</span>
          <span class="summary-label">Contados</span>
        </div>
        <div class="summary-item" [class.has-discrepancy]="count()!.discrepancyItems > 0">
          <span class="summary-value">{{ count()!.discrepancyItems }}</span>
          <span class="summary-label">Con diferencias</span>
        </div>
        <div class="summary-item">
          <span class="summary-value">{{ count()!.progressPercent }}%</span>
          <span class="summary-label">Completado</span>
        </div>
      </div>

      <!-- Ítems con discrepancia -->
      @if (discrepantItems().length > 0) {
        <div class="discrepancy-section">
          <h2 class="section-title">
            <mat-icon color="warn">warning</mat-icon>
            Ítems con diferencias ({{ discrepantItems().length }})
          </h2>
          <div class="discrepancy-list">
            @for (item of discrepantItems(); track item.id) {
              <div class="discrepancy-item">
                <span class="product-info">
                  <strong>{{ item.productCode }}</strong> — {{ item.productName }}
                </span>
                <span class="location-info">Ubic: {{ item.locationCode }}</span>
                <span class="qty-info">
                  Teórico: {{ item.theoreticalQty }} /
                  Contado: {{ item.countedQty ?? '—' }} /
                  <span [class]="item.difference !== null && item.difference < 0 ? 'diff-neg' : 'diff-pos'">
                    Dif: {{ item.difference !== null ? (item.difference > 0 ? '+' : '') + item.difference : '—' }}
                  </span>
                </span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Advertencia -->
      <div class="warning-box" role="alert">
        <mat-icon>warning</mat-icon>
        <p>
          Esta acción generará ajustes automáticos de inventario para los ítems con diferencias.
          <strong>Esta acción no se puede deshacer.</strong>
        </p>
      </div>

      <!-- Botones de acción -->
      <div class="action-buttons">
        <button mat-button [routerLink]="['/inventory/counts', countId]">
          Volver
        </button>
        <button
          mat-flat-button
          color="warn"
          [disabled]="submitting()"
          (click)="confirmCount()"
        >
          @if (submitting()) {
            <mat-spinner diameter="20" />
          } @else {
            Confirmar y aplicar ajustes
          }
        </button>
      </div>
    }
  `,
  styles: [`
    .page-header  { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .page-title   { margin: 0; font-size: 24px; font-weight: 500; }
    .state-center, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 16px; padding: 64px; text-align: center;
    }
    .summary-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 16px; margin-bottom: 32px;
    }
    .summary-item {
      display: flex; flex-direction: column; align-items: center;
      background: #f5f5f5; border-radius: 8px; padding: 16px;
    }
    .summary-item.has-discrepancy { background: #fff5f5; }
    .summary-value { font-size: 32px; font-weight: 700; }
    .summary-label { font-size: 12px; color: #666; text-align: center; }
    .discrepancy-section { margin-bottom: 24px; }
    .section-title { display: flex; align-items: center; gap: 8px; font-size: 18px; margin-bottom: 16px; }
    .discrepancy-list { border: 1px solid #fce4ec; border-radius: 8px; overflow: hidden; }
    .discrepancy-item {
      display: flex; gap: 16px; align-items: center; padding: 12px 16px;
      border-bottom: 1px solid #fce4ec; font-size: 14px;
    }
    .discrepancy-item:last-child { border-bottom: none; }
    .product-info { flex: 1; }
    .location-info { color: #666; }
    .qty-info { white-space: nowrap; }
    .diff-neg { color: #c62828; font-weight: 600; }
    .diff-pos { color: #2e7d32; font-weight: 600; }
    .warning-box {
      display: flex; gap: 12px; align-items: flex-start;
      background: #fff8e1; border: 1px solid #ffe082;
      border-radius: 8px; padding: 16px; margin-bottom: 24px; color: #f57f17;
    }
    .action-buttons { display: flex; gap: 12px; justify-content: flex-end; }
  `],
})
export class CountConfirmPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly countService = inject(CountService);
  private readonly dialog = inject(MatDialog);

  readonly count = signal<PhysicalCountDetail | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly submitting = signal(false);

  readonly discrepantItems = computed(() =>
    this.count()?.items.filter(i => i.hasDiscrepancy) ?? []
  );

  countId = '';

  ngOnInit(): void {
    this.countId = this.route.snapshot.paramMap.get('id') ?? '';
    this.loadDetail();
  }

  private loadDetail(): void {
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

  confirmCount(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar conteo',
        message: 'Esta acción generará ajustes automáticos para los ítems con diferencias. ¿Confirmar?',
        confirmLabel: 'Confirmar y aplicar',
        danger: true,
      },
    }).afterClosed().subscribe(confirmed => {
      if (confirmed) this.doConfirm();
    });
  }

  private doConfirm(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.countService.confirm(this.countId).subscribe({
      next: () => {
        this.router.navigate(['/inventory/counts']);
      },
      error: (err: AppError) => {
        this.error.set(err.title ?? 'Error al confirmar el conteo');
        this.submitting.set(false);
      },
    });
  }
}
