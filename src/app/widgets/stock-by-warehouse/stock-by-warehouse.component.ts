import { Component, Input, signal, OnChanges, SimpleChanges, inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { ApiClient } from '../../shared/api/http/api-client';
import type { StockByWarehouseEntry } from './stock-by-warehouse.types';
import type { AppError } from '../../shared/types';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-stock-by-warehouse',
  standalone: true,
  imports: [MatTableModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <!-- Estado: loading -->
    @if (loading()) {
      <div class="state-center">
        <mat-spinner diameter="36" />
      </div>
    }

    <!-- Estado: error -->
    @if (error() && !loading()) {
      <div class="state-error" role="alert">
        <mat-icon color="warn">error_outline</mat-icon>
        <p>{{ error()!.title }}</p>
      </div>
    }

    <!-- Estado: empty -->
    @if (!loading() && !error() && entries().length === 0) {
      <div class="state-empty">
        <mat-icon>inventory</mat-icon>
        <p>Sin stock en almacenes.</p>
      </div>
    }

    <!-- Tabla -->
    @if (!loading() && !error() && entries().length > 0) {
      <table mat-table [dataSource]="entries()" class="stock-table">
        <ng-container matColumnDef="warehouseName">
          <th mat-header-cell *matHeaderCellDef>Almacén</th>
          <td mat-cell *matCellDef="let e">{{ e.warehouseName }}</td>
        </ng-container>
        <ng-container matColumnDef="locationName">
          <th mat-header-cell *matHeaderCellDef>Ubicación</th>
          <td mat-cell *matCellDef="let e">{{ e.locationName || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>Cantidad</th>
          <td mat-cell *matCellDef="let e">{{ e.quantity }} {{ e.unit }}</td>
        </ng-container>
        <ng-container matColumnDef="reserved">
          <th mat-header-cell *matHeaderCellDef>Reservado</th>
          <td mat-cell *matCellDef="let e">{{ e.reserved }}</td>
        </ng-container>
        <ng-container matColumnDef="available">
          <th mat-header-cell *matHeaderCellDef>Disponible</th>
          <td mat-cell *matCellDef="let e">
            <span [class]="e.available <= 0 ? 'stock-zero' : 'stock-ok'">{{ e.available }}</span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    }
  `,
  styles: [`
    .state-center, .state-empty, .state-error {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 8px; padding: 32px; text-align: center; color: #666;
    }
    .state-empty mat-icon, .state-error mat-icon { font-size: 36px; width: 36px; height: 36px; opacity: .5; }
    .stock-table { width: 100%; }
    .stock-zero { color: #c62828; font-weight: 600; }
    .stock-ok   { color: #2e7d32; font-weight: 500; }
  `],
})
export class StockByWarehouseComponent implements OnChanges {
  @Input() productId!: string;

  private readonly api = inject(ApiClient);

  readonly displayedColumns = ['warehouseName', 'locationName', 'quantity', 'reserved', 'available'];
  readonly entries = signal<StockByWarehouseEntry[]>([]);
  readonly loading = signal(false);
  readonly error = signal<AppError | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId']?.currentValue) {
      this.loadStock(changes['productId'].currentValue);
    }
  }

  private loadStock(productId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<StockByWarehouseEntry[]>(`/inventory/stock/${productId}/by-warehouse`).pipe(
      map(entries => entries ?? [])
    ).subscribe({
      next: (entries) => { this.entries.set(entries); this.loading.set(false); },
      error: (err: AppError) => { this.error.set(err); this.loading.set(false); },
    });
  }
}
