import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StockService } from '../../shared/api/http/stock.service';
import type { StockEntry } from '../../entities/stock/stock.types';
import type { AppError } from '../../shared/types';

@Component({
  selector: 'app-low-stock-alerts',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="widget-header">
      <h3 class="widget-title">
        <mat-icon color="warn">warning</mat-icon>
        Alertas de stock
      </h3>
      <a mat-button routerLink="/inventory/stock" [queryParams]="{ status: 'low' }">
        Ver todas
      </a>
    </div>

    @if (loading()) {
      <div class="state-center"><mat-spinner diameter="32" /></div>
    } @else if (error()) {
      <div class="state-error">
        <mat-icon>error_outline</mat-icon>
        <span>Error al cargar alertas</span>
      </div>
    } @else if (alerts().length === 0) {
      <div class="state-ok">
        <mat-icon color="primary">check_circle</mat-icon>
        <span>Sin alertas de stock</span>
      </div>
    } @else {
      <ul class="alert-list">
        @for (a of alerts(); track a.productId) {
          <li class="alert-item" [class.alert-item--critical]="a.status === 'critical' || a.status === 'out'">
            <div class="alert-product">
              <span class="alert-name">{{ a.productName }}</span>
              <span class="alert-sku">{{ a.productSku }}</span>
            </div>
            <span [class]="'alert-badge alert-badge--' + a.statusColor">
              {{ a.availableQuantity }} {{ a.unit }}
            </span>
          </li>
        }
      </ul>
    }
  `,
  styles: [`
    :host { display: block; }
    .widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .widget-title  { margin: 0; font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .state-center, .state-ok, .state-error {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 24px; color: #666; font-size: 14px;
    }
    .alert-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .alert-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 12px; border-radius: 8px; background: #fff8e1;
    }
    .alert-item--critical { background: #fce4ec; }
    .alert-product { display: flex; flex-direction: column; gap: 2px; }
    .alert-name { font-weight: 500; font-size: 14px; }
    .alert-sku  { font-size: 12px; color: #666; }
    .alert-badge { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }
    .alert-badge--warn  { background: #fff8e1; color: #f57f17; }
    .alert-badge--error { background: #fce4ec; color: #c62828; }
  `],
})
export class LowStockAlertsComponent implements OnInit {
  private readonly stockService = inject(StockService);

  readonly alerts  = signal<StockEntry[]>([]);
  readonly loading = signal(false);
  readonly error   = signal<AppError | null>(null);

  ngOnInit(): void {
    this.loading.set(true);
    this.stockService.getCurrent({ page: 1, pageSize: 10, status: 'low' }).subscribe({
      next: ({ data }) => {
        // Mostrar low + critical + out
        const allAlerts = data.filter(e => e.status !== 'ok');
        this.alerts.set(allAlerts);
        this.loading.set(false);
      },
      error: (err: AppError) => { this.error.set(err); this.loading.set(false); },
    });
  }
}
