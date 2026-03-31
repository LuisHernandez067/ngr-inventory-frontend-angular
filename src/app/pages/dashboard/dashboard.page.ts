import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { KpiCardComponent } from '../../widgets/kpi-card/kpi-card.component';
import { LowStockAlertsComponent } from '../../widgets/low-stock-alerts/low-stock-alerts.component';
import { StockService } from '../../shared/api/http/stock.service';
import type { StockKpis } from '../../shared/api/http/stock.service';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule, MatIconModule, MatCardModule,
    KpiCardComponent, LowStockAlertsComponent,
  ],
  template: `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <button mat-flat-button color="primary" routerLink="/inventory/movements/new">
        <mat-icon>add</mat-icon> Registrar movimiento
      </button>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid">
      <app-kpi-card
        label="Productos activos"
        [value]="kpis()?.totalProducts ?? 0"
        icon="inventory_2"
        [loading]="loadingKpis()"
      />
      <app-kpi-card
        label="Movimientos hoy"
        [value]="kpis()?.totalMovementsToday ?? 0"
        icon="swap_horiz"
        [loading]="loadingKpis()"
      />
      <app-kpi-card
        label="Alertas de stock bajo"
        [value]="kpis()?.lowStockAlerts ?? 0"
        icon="warning"
        [loading]="loadingKpis()"
        [variant]="(kpis()?.lowStockAlerts ?? 0) > 0 ? 'warn' : 'default'"
      />
      <app-kpi-card
        label="Sin stock"
        [value]="kpis()?.outOfStockCount ?? 0"
        icon="remove_shopping_cart"
        [loading]="loadingKpis()"
        [variant]="(kpis()?.outOfStockCount ?? 0) > 0 ? 'alert' : 'default'"
      />
      <app-kpi-card
        label="Almacenes activos"
        [value]="kpis()?.totalWarehouses ?? 0"
        icon="warehouse"
        [loading]="loadingKpis()"
      />
    </div>

    <!-- Widgets secundarios -->
    <div class="widgets-row">
      <mat-card class="widget-card">
        <mat-card-content>
          <app-low-stock-alerts />
        </mat-card-content>
      </mat-card>

      <mat-card class="widget-card">
        <mat-card-content>
          <div class="quick-links-header">
            <h3 class="widget-title">Accesos rápidos</h3>
          </div>
          <div class="quick-links">
            <a mat-stroked-button routerLink="/inventory/movements/new">
              <mat-icon>add_circle</mat-icon> Nuevo movimiento
            </a>
            <a mat-stroked-button routerLink="/inventory/stock">
              <mat-icon>inventory</mat-icon> Ver stock
            </a>
            <a mat-stroked-button routerLink="/inventory/kardex">
              <mat-icon>receipt_long</mat-icon> Kardex global
            </a>
            <a mat-stroked-button routerLink="/catalog/products">
              <mat-icon>category</mat-icon> Catálogo
            </a>
            <a mat-stroked-button routerLink="/inventory/warehouses">
              <mat-icon>warehouse</mat-icon> Almacenes
            </a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .page-title  { margin: 0; font-size: 24px; font-weight: 500; }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .widgets-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .widget-card { height: 100%; }
    .widget-title { margin: 0 0 16px; font-size: 16px; font-weight: 600; }
    .quick-links { display: flex; flex-direction: column; gap: 10px; }
    .quick-links a { justify-content: flex-start; }
    @media (max-width: 768px) {
      .widgets-row { grid-template-columns: 1fr; }
      .kpi-grid    { grid-template-columns: 1fr 1fr; }
    }
  `],
})
export class DashboardPage implements OnInit {
  private readonly stockService = inject(StockService);

  readonly kpis        = signal<StockKpis | null>(null);
  readonly loadingKpis = signal(false);

  ngOnInit(): void {
    this.loadingKpis.set(true);
    this.stockService.getKpis().subscribe({
      next: (kpis) => { this.kpis.set(kpis); this.loadingKpis.set(false); },
      error: () => this.loadingKpis.set(false),
    });
  }
}
