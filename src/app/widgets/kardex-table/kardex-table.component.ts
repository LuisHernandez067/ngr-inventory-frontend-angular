import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import type { Movement } from '../../entities/movement/movement.types';

@Component({
  selector: 'app-kardex-table',
  standalone: true,
  imports: [DatePipe, MatTableModule, MatIconModule],
  template: `
    @if (movements.length === 0) {
      <div class="state-empty">
        <mat-icon>receipt_long</mat-icon>
        <p>No hay movimientos para mostrar.</p>
      </div>
    } @else {
      <table mat-table [dataSource]="movements" class="kardex-table">
        <ng-container matColumnDef="date">
          <th mat-header-cell *matHeaderCellDef>Fecha</th>
          <td mat-cell *matCellDef="let m">{{ m.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
        </ng-container>
        <ng-container matColumnDef="type">
          <th mat-header-cell *matHeaderCellDef>Tipo</th>
          <td mat-cell *matCellDef="let m">
            <span class="type-badge">
              <mat-icon class="type-icon">{{ m.directionIcon }}</mat-icon>
              {{ m.typeLabel }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="product">
          <th mat-header-cell *matHeaderCellDef>Producto</th>
          <td mat-cell *matCellDef="let m">
            <span class="product-name">{{ m.productName }}</span>
            <span class="product-sku">{{ m.productSku }}</span>
          </td>
        </ng-container>
        <ng-container matColumnDef="quantity">
          <th mat-header-cell *matHeaderCellDef>Cantidad</th>
          <td mat-cell *matCellDef="let m">
            <span [class]="m.isDestructive ? 'qty-out' : 'qty-in'">
              {{ m.isDestructive ? '-' : '+' }}{{ m.quantity }} {{ m.unit }}
            </span>
          </td>
        </ng-container>
        <ng-container matColumnDef="warehouse">
          <th mat-header-cell *matHeaderCellDef>Almacén</th>
          <td mat-cell *matCellDef="let m">
            @if (m.sourceWarehouseName && m.destinationWarehouseName) {
              {{ m.sourceWarehouseName }} → {{ m.destinationWarehouseName }}
            } @else {
              {{ m.sourceWarehouseName || m.destinationWarehouseName || '—' }}
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="reference">
          <th mat-header-cell *matHeaderCellDef>Referencia</th>
          <td mat-cell *matCellDef="let m">{{ m.reference || '—' }}</td>
        </ng-container>
        <ng-container matColumnDef="user">
          <th mat-header-cell *matHeaderCellDef>Usuario</th>
          <td mat-cell *matCellDef="let m">{{ m.performedByName }}</td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let m">
            <span [class]="'status-chip status-chip--' + m.status.toLowerCase()">
              {{ m.statusLabel }}
            </span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
      </table>
    }
  `,
  styles: [`
    .kardex-table { width: 100%; }
    .state-empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 48px; text-align: center; color: #666;
    }
    .state-empty mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: .5; }
    .type-badge  { display: flex; align-items: center; gap: 4px; }
    .type-icon   { font-size: 18px; width: 18px; height: 18px; }
    .product-name { display: block; font-weight: 500; }
    .product-sku  { display: block; font-size: 12px; color: #666; }
    .qty-in  { color: #2e7d32; font-weight: 600; }
    .qty-out { color: #c62828; font-weight: 600; }
    .status-chip { padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500; }
    .status-chip--confirmed { background: #e8f5e9; color: #2e7d32; }
    .status-chip--pending   { background: #fff8e1; color: #f57f17; }
    .status-chip--cancelled { background: #fce4ec; color: #c62828; }
  `],
})
export class KardexTableComponent {
  @Input() movements: Movement[] = [];
  @Input() displayedColumns: string[] = ['date', 'type', 'product', 'quantity', 'warehouse', 'reference', 'user', 'status'];
}
